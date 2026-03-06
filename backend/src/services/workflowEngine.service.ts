import { prisma } from "../lib/prisma";
import { notificationService } from "./notification.service";

/**
 * Workflow Engine Service
 * Handles the execution and progression of workflows.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CORE: Recursive Graph Traversal Engine
// Traverses nodes one-by-one, stopping ONLY at ACTION/APPROVAL nodes to create a Task.
// ─────────────────────────────────────────────────────────────────────────────
async function processWorkflow(params: {
    nodes: any[];
    edges: any[];
    steps: any[];
    currentNodeId: string;
    context: Record<string, any>;
    tx: any;
    organisationId: string;
    instanceId: string;
}): Promise<{ status: string; taskId?: string; assignedTo?: string; reason?: string }> {
    const { nodes, edges, steps, currentNodeId, context, tx, organisationId, instanceId } = params;

    const node = nodes.find((n: any) => n.id === currentNodeId);
    if (!node) {
        console.log(`[Engine] ⚠️ Node "${currentNodeId}" not found. Stopping.`);
        return { status: 'COMPLETED' };
    }

    // Prioritize data.variant (set by NexFlow designer) over node.type
    const nodeType: string = (node.data?.variant || node.type || '').toLowerCase();
    const nodeTitle: string = node.data?.title || node.data?.label || nodeType;
    // Also read the assignedTo field set in NexFlow node properties
    const assignedTo: string = (node.data?.assignedTo || '').toLowerCase();

    console.log(`[Engine] 🔍 Processing node: "${nodeTitle}" (variant: ${nodeType}, assignedTo: ${assignedTo || 'none'})`);

    // ── Determine outgoing edges ───────────────────────────────────────────
    const getNextNodeId = (sourceHandle?: string): string | null => {
        const outgoing = edges.filter((e: any) => e.source === node.id);
        const edge = sourceHandle
            ? outgoing.find((e: any) => e.sourceHandle === sourceHandle) || null
            : outgoing[0] || null;
        return edge ? edge.target : null;
    };

    // ─────────────────────────────────────────────────────────────────────
    // END node: Mark instance as COMPLETED
    // ─────────────────────────────────────────────────────────────────────
    if (nodeType === 'end') {
        console.log(`[Engine] ✅ End node reached. Process COMPLETED.`);
        await tx.processInstance.update({
            where: { id: instanceId },
            data: { status: 'COMPLETED' }
        });
        return { status: 'COMPLETED' };
    }

    // ─────────────────────────────────────────────────────────────────────
    // TRIGGER node: Pass-through, move to next
    // ─────────────────────────────────────────────────────────────────────
    if (nodeType === 'trigger' || nodeType === 'start') {
        console.log(`[Engine] 🚀 Trigger node. Moving to next...`);
        const nextId = getNextNodeId();
        if (!nextId) return { status: 'COMPLETED' };
        return processWorkflow({ ...params, currentNodeId: nextId });
    }

    // ─────────────────────────────────────────────────────────────────────
    // API / CHECK node: Execute (simulated), move to next
    // ─────────────────────────────────────────────────────────────────────
    if (nodeType === 'api' || nodeType === 'check' || nodeType === 'apicall') {
        console.log(`[Engine] 🌐 API node "${nodeTitle}" — Exécution (simulée)...`);
        // TODO: Here you can add real HTTP calls if needed
        const nextId = getNextNodeId();
        if (!nextId) return { status: 'COMPLETED' };
        return processWorkflow({ ...params, currentNodeId: nextId });
    }

    // ─────────────────────────────────────────────────────────────────────
    // CONDITION node: Evaluate, pick true/false edge, continue
    // ─────────────────────────────────────────────────────────────────────
    if (nodeType === 'condition') {
        console.log(`[Engine] 🧠 Évaluation Condition: "${nodeTitle}"...`);
        let conditionResult = true; // Default

        // Evaluate based on duration (leaveDays < 5)
        if (context.startDate && context.endDate) {
            const diffDays = Math.ceil(
                Math.abs(new Date(context.endDate).getTime() - new Date(context.startDate).getTime())
                / (1000 * 60 * 60 * 24)
            );
            conditionResult = diffDays < 5;
            console.log(`[Engine] 📊 diffDays=${diffDays} → Condition is ${conditionResult ? 'TRUE ✅' : 'FALSE ❌'}`);
        }

        // Find the correct edge based on condition result
        const allOutgoing = edges.filter((e: any) => e.source === node.id);
        const targetEdge = allOutgoing.find((e: any) => e.sourceHandle === (conditionResult ? 'true' : 'false'));

        if (!targetEdge) {
            console.log(`[Engine] ❌ Aucun Edge pour le handle "${conditionResult ? 'true' : 'false'}". Auto-REJET.`);
            await tx.processInstance.update({
                where: { id: instanceId },
                data: { status: 'REJECTED' }
            });
            return { status: 'TERMINATED', reason: 'AUTO_REJECTED' };
        }

        const chosenRole = conditionResult ? 'Manager' : 'RH';
        console.log(`[Engine] ✅ Chemin choisi : ${chosenRole} (handle="${conditionResult ? 'true' : 'false'}")`);
        return processWorkflow({ ...params, currentNodeId: targetEdge.target });
    }

    // ─────────────────────────────────────────────────────────────────────
    // ACTION / APPROVAL / HUMAN TASK node: CREATE a Task and STOP
    // Matches: 'action', 'approval', 'task', 'humantask', 'manager', 'rh',
    //          'managerapproval', 'rhvalidation', 'humanTask', or any unknown node that should block.
    // ─────────────────────────────────────────────────────────────────────
    const isActionNode = [
        'action', 'approval', 'task', 'humantask', 'manager', 'rh',
        'managerapproval', 'rhvalidation', 'usertask', 'manualtask'
    ].includes(nodeType) || nodeType.includes('action') || nodeType.includes('approval');

    if (isActionNode || (!['trigger', 'start', 'api', 'check', 'apicall', 'condition', 'end'].includes(nodeType))) {
        console.log(`[Engine] 🛑 Nœud Action trouvé : "${nodeTitle}" — Création tâche...`);

        // Map node to a DB Step
        let targetStep = steps.find((s: any) => s.name === nodeTitle);
        if (!targetStep && steps.length > 0) targetStep = steps[0];

        // Determine assignee: check data.assignedTo first, then fall back to title/type keywords
        let assigneeUser = null;
        const isRH = assignedTo === 'rh' || nodeTitle.toUpperCase().includes('RH') || nodeType === 'rh' || nodeType === 'rhvalidation';

        if (isRH) {
            assigneeUser = await tx.user.findFirst({
                where: { organisationId, rh: { isNot: null } }
            });
            console.log(`[Engine] 👤 Nœud Action trouvé : Création tâche pour les RH`);
        } else {
            assigneeUser = await tx.user.findFirst({
                where: { organisationId, manager: { isNot: null } }
            });
            console.log(`[Engine] 👤 Nœud Action trouvé : Création tâche pour le Manager`);
        }

        const durationLabel = (context.startDate && context.endDate)
            ? ` - ${Math.ceil(Math.abs(new Date(context.endDate).getTime() - new Date(context.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours`
            : '';

        const task = await tx.task.create({
            data: {
                title: `${nodeTitle}${durationLabel}`,
                status: 'PENDING',
                processInstanceId: instanceId,
                stepId: targetStep?.id || steps[0]?.id,
                organisationId,
                userId: assigneeUser?.id || null
            }
        });

        // Notify assignee
        if (assigneeUser?.id) {
            await notificationService.createNotification(
                assigneeUser.id,
                `Nouvelle tâche à valider : "${nodeTitle}"${durationLabel}`,
                'TASK_CREATED'
            );
        }

        return {
            status: 'TASK_CREATED',
            taskId: task.id,
            assignedTo: assigneeUser?.email || 'Unassigned'
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // Unknown node type: pass-through to next
    // ─────────────────────────────────────────────────────────────────────
    console.log(`[Engine] ⏩ Unknown node type "${nodeType}". Passing through...`);
    const fallbackNext = getNextNodeId();
    if (!fallbackNext) return { status: 'COMPLETED' };
    return processWorkflow({ ...params, currentNodeId: fallbackNext });
}


export const workflowEngineService = {
    /**
     * Starts a new workflow instance for a given application (Recruitment flow).
     */
    async startWorkflowInstance(applicationId: string, workflowId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const application = await tx.application.findUnique({
                where: { id: applicationId },
                include: { jobOffer: { select: { organisationId: true } } }
            });
            if (!application) throw new Error(`Application with ID ${applicationId} not found.`);
            const organisationId = application.jobOffer.organisationId;

            const workflow = await tx.workflow.findUnique({
                where: { id: workflowId },
                include: { steps: true }
            });
            if (!workflow) throw new Error(`Workflow with ID ${workflowId} not found.`);

            const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
            const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : [];

            const startNode = nodes.find((n) =>
                n.data?.variant === 'trigger' || n.type === 'trigger' ||
                n.data?.title?.toLowerCase().includes('début') || n.data?.label === 'START'
            );
            if (!startNode) throw new Error("Could not find a starting trigger node in the workflow.");

            const outgoingEdge = edges.find((e) => e.source === startNode.id);
            if (!outgoingEdge) throw new Error("Trigger node is not connected to any subsequent step.");

            const firstTaskNode = nodes.find((n) => n.id === outgoingEdge.target);
            if (!firstTaskNode) throw new Error("The first task node could not be found in the workflow nodes.");

            const instance = await tx.processInstance.create({
                data: { workflowId: workflow.id, status: "IN_PROGRESS" }
            });

            await tx.application.update({
                where: { id: applicationId },
                data: { status: "IN_PROGRESS", processInstanceId: instance.id }
            });

            const stepName = firstTaskNode.data?.title || firstTaskNode.data?.label;
            let targetStep = workflow.steps.find((s: any) => s.name === stepName);
            if (!targetStep && workflow.steps.length > 0) targetStep = workflow.steps[0];
            if (!targetStep) throw new Error("No steps found in the database for this workflow to link the task.");

            const rhUser = await tx.user.findFirst({ where: { organisationId, rh: { isNot: null } } });

            const task = await tx.task.create({
                data: {
                    title: stepName || "Première étape de validation",
                    status: "PENDING",
                    processInstanceId: instance.id,
                    stepId: targetStep.id,
                    organisationId,
                    userId: rhUser?.id || null,
                }
            });

            await tx.eventLog.create({
                data: {
                    action: `INSTANCE_STARTED: Workflow "${workflow.name}" initialized for application ${applicationId}`,
                    processInstanceId: instance.id,
                    userId: rhUser?.id || null
                }
            });

            return { instanceId: instance.id, firstTaskId: task.id, assignedTo: rhUser?.email || "Unassigned" };
        }, { maxWait: 10000, timeout: 20000 });

        import("./ai.service").then(({ aiService }) => {
            aiService.generateCandidateAnalysis(applicationId).catch((err: any) => {
                console.error("Failed to generate AI analysis:", err);
            });
        });

        return result;
    },

    /**
     * Starts a new process instance for a generic request (e.g. Employee Leave Request).
     * Uses the recursive processWorkflow engine for correct node traversal.
     */
    async startProcessInstance(workflowId: string, userId: string, organisationId: string, metadata?: any) {
        console.log('🚀 Démarrage du processus métier...');
        try {
            const result = await prisma.$transaction(async (tx) => {
                const workflow = await tx.workflow.findUnique({ where: { id: workflowId } });

                if (!workflow || workflow.organisationId !== organisationId) {
                    throw new Error(`Workflow not found or unauthorized for your organisation.`);
                }

                const initiator = await tx.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, lastName: true, email: true }
                });
                const initiatorName = initiator ? `${initiator.firstName} ${initiator.lastName}` : "Inconnu";

                // Save Document if present
                if (metadata?.file) {
                    await tx.document.create({
                        data: {
                            fileName: metadata.file.originalname,
                            fileUrl: metadata.file.path,
                            docType: metadata.file.mimetype,
                            userId,
                            organisationId
                        }
                    });
                }

                // Create the ProcessInstance with full context
                const instance = await tx.processInstance.create({
                    data: {
                        workflowId: workflow.id,
                        userId,
                        status: "IN_PROGRESS",
                        context: {
                            startDate: metadata?.startDate,
                            endDate: metadata?.endDate,
                            reason: metadata?.reason,
                            initiatorName,
                            initiatorEmail: initiator?.email || ""
                        }
                    }
                });

                const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
                const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : [];
                const steps = await tx.step.findMany({ where: { workflowId: workflow.id } });

                // Find trigger / start node
                const triggerNode = nodes.find((n: any) =>
                    n.type === 'trigger' || n.data?.variant === 'trigger' ||
                    n.type === 'start' || n.data?.label === 'START'
                );

                if (!triggerNode) {
                    throw new Error("No trigger/start node found in workflow.");
                }

                console.log(`[Engine] 🗺️ Workflow "${workflow.name}" — starting at node: "${triggerNode.data?.title || triggerNode.id}"`);

                const context: Record<string, any> = {
                    startDate: metadata?.startDate,
                    endDate: metadata?.endDate,
                    reason: metadata?.reason,
                    initiatorName,
                };

                // Run the recursive engine starting from trigger
                const engineResult = await processWorkflow({
                    nodes,
                    edges,
                    steps,
                    currentNodeId: triggerNode.id,
                    context,
                    tx,
                    organisationId,
                    instanceId: instance.id
                });

                await tx.eventLog.create({
                    data: {
                        action: `PROCESS_STARTED: Workflow "${workflow.name}" started by user ${userId}. Result: ${engineResult.status}`,
                        processInstanceId: instance.id,
                        userId
                    }
                });

                return { instanceId: instance.id, ...engineResult };
            }, { maxWait: 15000, timeout: 30000 });

            console.log('✅ Processus créé avec succès');
            return result;
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du processus métier :', error);
            throw error;
        }
    },

    /**
     * Completes a task and advances the workflow to the next step using the recursive engine.
     */
    async completeTaskAndMoveToNext(taskId: string, action: 'APPROVE' | 'REJECT', userId: string) {
        return prisma.$transaction(async (tx) => {
            const task = await tx.task.findUnique({
                where: { id: taskId },
                include: {
                    processInstance: { include: { workflow: true, application: true } },
                    step: true
                }
            });

            if (!task) throw new Error("Task not found.");
            if (task.status !== 'PENDING') throw new Error("Task is already completed.");

            const { processInstance } = task;
            const { workflow, application } = processInstance;

            // Mark this task done
            await tx.task.update({
                where: { id: taskId },
                data: {
                    status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
                    completedAt: new Date(),
                }
            });

            // Notify initiator on approve
            if (action === 'APPROVE' && processInstance.userId) {
                await notificationService.createNotification(
                    processInstance.userId,
                    `Votre demande de ${workflow.name} a été approuvée`,
                    'PROCESS_APPROVED'
                );
            }

            // Handle manual REJECT
            if (action === 'REJECT') {
                await tx.processInstance.update({
                    where: { id: processInstance.id },
                    data: { status: 'REJECTED' }
                });

                if (application) {
                    await tx.application.update({
                        where: { id: application.id },
                        data: { status: 'REJECTED' }
                    });
                }

                await tx.eventLog.create({
                    data: {
                        action: `TASK_REJECTED: Task "${task.title}" rejected by user ${userId}.`,
                        processInstanceId: processInstance.id,
                        userId
                    }
                });

                return { status: 'TERMINATED', reason: 'REJECTED' };
            }

            // Find current node in the graph corresponding to the completed task
            const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
            const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : [];
            const steps = await tx.step.findMany({ where: { workflowId: workflow.id } });

            const currentNode = nodes.find((n: any) =>
                n.data?.title === task.step.name || n.data?.label === task.step.name
            );

            if (!currentNode) {
                throw new Error("Could not find the current step node in the workflow graph.");
            }

            // Get the next node from the current one
            const outgoing = edges.filter((e: any) => e.source === currentNode.id);
            if (outgoing.length === 0) {
                // No outgoing edges: end of workflow
                await tx.processInstance.update({
                    where: { id: processInstance.id },
                    data: { status: 'COMPLETED' }
                });
                if (application) {
                    await tx.application.update({
                        where: { id: application.id },
                        data: { status: 'COMPLETED' }
                    });
                }
                return { status: 'COMPLETED' };
            }

            const nextNodeId = outgoing[0].target;

            // Build context from processInstance
            const context = (
                processInstance.context !== null && typeof processInstance.context === 'object'
            ) ? (processInstance.context as Record<string, any>) : {};

            console.log(`[Engine] ▶️ Continuing from task "${task.title}" → next node: "${nextNodeId}"`);

            // Resume the recursive engine from the next node
            const engineResult = await processWorkflow({
                nodes,
                edges,
                steps,
                currentNodeId: nextNodeId,
                context,
                tx,
                organisationId: workflow.organisationId,
                instanceId: processInstance.id
            });

            // If it reaches COMPLETED naturally
            if (engineResult.status === 'COMPLETED' || engineResult.status === 'TERMINATED') {
                if (application) {
                    await tx.application.update({
                        where: { id: application.id },
                        data: {
                            status: engineResult.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'
                        }
                    });
                }
            }

            await tx.eventLog.create({
                data: {
                    action: `TASK_APPROVED: "${task.title}" approved by ${userId}. Engine result: ${engineResult.status}.`,
                    processInstanceId: processInstance.id,
                    userId
                }
            });

            return { status: engineResult.status === 'TASK_CREATED' ? 'ADVANCED' : engineResult.status, taskId: engineResult.taskId, assignedTo: engineResult.assignedTo, reason: engineResult.reason };
        }, { maxWait: 10000, timeout: 20000 });
    },

    /**
     * Approves a task (alias for completeTaskAndMoveToNext with 'APPROVE')
     */
    async approveTask(taskId: string, userId: string) {
        return this.completeTaskAndMoveToNext(taskId, 'APPROVE', userId);
    }
};
