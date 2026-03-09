import { prisma } from "../lib/prisma";
import { notificationService } from "./notification.service";
import { mailService } from "./mail.service";
import { certificateService } from "./certificate.service";
import { aiAuditService } from "./ai-audit.service";

/**
 * Helper: Evaluates conditions like "Duree > 5 jours"
 */
const evaluateCondition = (conditionText: string | null, context: any): boolean => {
    if (!conditionText || conditionText.trim() === "" || conditionText.toLowerCase().includes("validation")) return true;

    try {
        // 1. Clean and Normalize the Expression
        let expression = conditionText
            .toLowerCase()
            .replace(/jours|days|dh| /g, "")
            .replace(/duree|durée/g, "duration")
            .replace(/montant/g, "amount")
            .replace(/prix|total/g, "amount") // Universal mapping
            .trim();

        // 2. Build a Clean Evaluation Context
        const evalContext: any = {};
        Object.keys(context).forEach(key => {
            const val = context[key];
            // If it looks like a number, treat it as a number
            evalContext[key] = !isNaN(Number(val)) ? Number(val) : val;
        });

        // Add duration automatically if missing but dates exist
        if (evalContext.startDate && evalContext.endDate && !evalContext.duration) {
            const start = new Date(evalContext.startDate);
            const end = new Date(evalContext.endDate);
            evalContext.duration = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        const keys = Object.keys(evalContext);
        const values = Object.values(evalContext);

        console.log(`[WorkflowEngine] Logic Check: "${expression}" | Values:`, evalContext);

        return new Function(...keys, `return ${expression};`)(...values);
    } catch (e) {
        console.warn("⚠️ Engine could not evaluate condition:", conditionText);
        return false;
    }
};

/**
 * Resolves a User based on a flexible role string (Admin, RH, Manager).
 * Ensures the user belongs to the same organisation.
 */
const findUserByFlexibleRole = async (roleName: string, organisationId: string, tx: any) => {
    const role = roleName.toLowerCase().trim();
    if (role === 'system' || role === 'systeme') return { id: 'SYSTEM', email: 'system@nexflow.ai' };

    console.log(`[WorkflowEngine] Searching for user with role: "${role}" in Org: ${organisationId}`);

    let user = null;

    // 1. Admin / Administrateur / Director Logic
    if (role.includes('admin') || role.includes('directeur') || role.includes('administrateur')) {
        user = await tx.user.findFirst({
            where: { organisationId, admin: { isNot: null } }
        });
    }
    // 2. RH / HR / Ressources Humaines Logic
    else if (role.includes('rh') || role.includes('ressources') || role.includes('human')) {
        user = await tx.user.findFirst({
            where: { organisationId, rh: { isNot: null } }
        });
    }
    // 3. Manager / Responsable / Supervisor Logic
    else {
        user = await tx.user.findFirst({
            where: { organisationId, manager: { isNot: null } }
        });
    }

    if (!user) {
        console.warn(`[WorkflowEngine] ⚠️ No user found for role: "${role}". Ensure a user has this role assigned in DB.`);
    } else {
        console.log(`[WorkflowEngine] ✅ Assigned to: ${user.email} (${role})`);
    }

    return user;
};

/**
 * Workflow Engine Service
 * Handles the execution and progression of workflows.
 */
export const workflowEngineService = {
    /**
     * Starts a new workflow instance for a given application.
     * 1. Fetches workflow and application data.
     * 2. Identifies the starting trigger node and its immediate successor.
     * 3. Creates a ProcessInstance and updates Application status.
     * 4. Creates the first Task for the RH role.
     * 5. Logs the event.
     */
    async startWorkflowInstance(applicationId: string, workflowId: string) {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Application and verify existence
            const application = await tx.application.findUnique({
                where: { id: applicationId },
                include: {
                    jobOffer: {
                        select: { organisationId: true }
                    }
                }
            });

            if (!application) {
                throw new Error(`Application with ID ${applicationId} not found.`);
            }

            const organisationId = application.jobOffer.organisationId;

            // 2. Fetch Workflow with its nodes, edges and steps
            const workflow = await tx.workflow.findUnique({
                where: { id: workflowId },
                include: { steps: true }
            });

            if (!workflow) {
                throw new Error(`Workflow with ID ${workflowId} not found.`);
            }

            const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
            const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : [];

            // 3. Find Global Trigger Node (START)
            // We look for nodes with variant 'trigger' or specific labels
            const startNode = nodes.find((n) =>
                n.data?.variant === 'trigger' ||
                n.type === 'trigger' ||
                n.data?.title?.toLowerCase().includes('début') ||
                n.data?.label === 'START'
            );

            if (!startNode) {
                throw new Error("Could not find a starting trigger node in the workflow.");
            }

            // 4. Find the first task node (successor of the trigger)
            const outgoingEdge = edges.find((e) => e.source === startNode.id);
            if (!outgoingEdge) {
                throw new Error("Trigger node is not connected to any subsequent step.");
            }

            const firstTaskNode = nodes.find((n) => n.id === outgoingEdge.target);
            if (!firstTaskNode) {
                throw new Error("The first task node could not be found in the workflow nodes.");
            }

            // 5. Create the ProcessInstance
            const instance = await tx.processInstance.create({
                data: {
                    workflowId: workflow.id,
                    status: "IN_PROGRESS"
                }
            });

            // 6. Update Application: link instance and move status to IN_PROGRESS
            await tx.application.update({
                where: { id: applicationId },
                data: {
                    status: "IN_PROGRESS",
                    processInstanceId: instance.id
                }
            });

            // 7. Resolve the corresponding Step in the DB
            // We try to match by title/label, or fallback to the first available step
            const stepName = firstTaskNode.data?.title || firstTaskNode.data?.label;
            let targetStep = workflow.steps.find((s: any) => s.name === stepName);

            // If no name match, fallback to first step or create one if necessary
            if (!targetStep && workflow.steps.length > 0) {
                targetStep = workflow.steps[0];
            }

            if (!targetStep) {
                throw new Error("No steps found in the database for this workflow to link the task.");
            }

            // 8. Find an RH user in the organisation to assign the first task
            const rhUser = await tx.user.findFirst({
                where: {
                    organisationId,
                    rh: { isNot: null }
                }
            });

            // 9. Create the first Task
            const task = await tx.task.create({
                data: {
                    title: stepName || "Première étape de validation",
                    status: "PENDING",
                    processInstanceId: instance.id,
                    stepId: targetStep.id,
                    organisationId,
                    userId: rhUser?.id || null, // Assign to RH user if found
                }
            });

            // 10. Log the creation event in EventLog
            await tx.eventLog.create({
                data: {
                    action: `INSTANCE_STARTED: Workflow "${workflow.name}" initialized for application ${applicationId}`,
                    processInstanceId: instance.id,
                    userId: rhUser?.id || null
                }
            });

            return {
                instanceId: instance.id,
                firstTaskId: task.id,
                assignedTo: rhUser?.email || "Unassigned"
            };
        }, { maxWait: 10000, timeout: 20000 });

        // Trigger AI Analysis asynchronously after transaction success
        import("./ai.service").then(({ aiService }) => {
            aiService.generateCandidateAnalysis(applicationId).catch(err => {
                console.error("Failed to generate AI analysis:", err);
            });
        });

        return result;
    },

    /**
     * Helper to create the first task of a process.
     * Identifies the node following the trigger or of type 'approval'.
     */
    async createInitialTask(workflowId: string, processInstanceId: string, organisationId: string, tx: any) {
        const workflow = await tx.workflow.findUnique({
            where: { id: workflowId },
            include: { steps: true }
        });

        if (!workflow) throw new Error("Workflow not found");

        const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
        const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : [];

        // 1. Find Trigger
        const triggerNode = nodes.find(n => n.type === 'trigger' || n.data?.variant === 'trigger');
        if (!triggerNode) throw new Error("Trigger node not found");

        // 2. Find next node or Approval node
        const edge = edges.find(e => e.source === triggerNode.id);
        const nextNode = edge ? nodes.find(n => n.id === edge.target) : null;

        const targetNode = nextNode || nodes.find(n => n.type === 'approval');
        if (!targetNode) throw new Error("No initial task node found");

        const stepName = targetNode.data?.title || targetNode.data?.label || "Validation initiale";

        // 3. Find target step in DB
        let targetStep = workflow.steps.find((s: any) => s.name === stepName);
        if (!targetStep && workflow.steps.length > 0) targetStep = workflow.steps[0];
        if (!targetStep) throw new Error("No linked steps found in database");

        // 4. Find a Manager
        const manager = await tx.user.findFirst({
            where: { organisationId, manager: { isNot: null } }
        });

        // 5. Create the Task
        return await tx.task.create({
            data: {
                title: stepName,
                status: "PENDING",
                processInstanceId: processInstanceId,
                stepId: targetStep.id,
                organisationId,
                userId: manager?.id || null
            }
        });
    },

    /**
     * Starts a new process instance for a generic request (e.g. Employee Request).
     * This version does NOT require an application.
     */
    async startProcessInstance(workflowId: string, userId: string, organisationId: string, metadata?: any) {
        console.log('🚀 Starting new dynamic process instance...');
        let sideEffects: any[] = [];
        try {
            const result = await prisma.$transaction(async (tx) => {
                const workflow = await tx.workflow.findUnique({
                    where: { id: workflowId },
                    include: { steps: true }
                });

                if (!workflow) throw new Error("Workflow not found.");

                const nodes = (workflow.nodes as any[]) || [];
                const edges = (workflow.edges as any[]) || [];

                const triggerNode = nodes.find(n => n.type === 'trigger' || n.data?.variant === 'trigger' || n.data?.label === 'START');

                if (!triggerNode) {
                    throw new Error("Workflow graph is missing a START/Trigger node");
                }
                const firstEdge = edges.find(e => e.source === triggerNode?.id);
                const firstTaskNode = nodes.find(n => n.id === firstEdge?.target);

                if (!firstTaskNode) throw new Error("Could not find the first task in the workflow graph.");

                let context: any = { ...metadata };
                if (context.startDate && context.endDate && !context.duration) {
                    const start = new Date(context.startDate);
                    const end = new Date(context.endDate);
                    context.duration = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                }

                Object.keys(context).forEach(key => {
                    const val = context[key];
                    if (!isNaN(Number(val))) context[key] = Number(val);
                });

                const instance = await tx.processInstance.create({
                    data: {
                        workflowId: workflow.id,
                        userId,
                        status: "IN_PROGRESS",
                        context: context
                    }
                });

                const stepName = firstTaskNode.data?.title || firstTaskNode.data?.label || firstTaskNode.label;
                const nodeRole = firstTaskNode.role || firstTaskNode.data?.role || "MANAGER";

                const assignedUser = await findUserByFlexibleRole(nodeRole, organisationId, tx);

                let targetStep = await tx.step.findFirst({ where: { workflowId: workflow.id, name: stepName } });
                if (!targetStep) {
                    const lastStep = await tx.step.findFirst({
                        where: { workflowId: workflow.id },
                        orderBy: { order: 'desc' }
                    });
                    const nextOrder = (lastStep?.order || 0) + 1;
                    targetStep = await tx.step.create({
                        data: {
                            name: stepName,
                            workflowId: workflow.id,
                            order: nextOrder,
                            metadata: { nodeId: firstTaskNode.id, role: nodeRole }
                        }
                    });
                }

                const task = await tx.task.create({
                    data: {
                        title: stepName,
                        status: "PENDING",
                        processInstanceId: instance.id,
                        stepId: targetStep.id,
                        organisationId,
                        userId: (assignedUser && assignedUser.id !== 'SYSTEM') ? assignedUser.id : null
                    }
                });

                if (assignedUser && assignedUser.id !== 'SYSTEM') {
                    sideEffects.push({ type: 'NOTIFY', userId: assignedUser.id, message: `New Task: ${stepName}` });
                }

                await tx.eventLog.create({
                    data: {
                        action: `PROCESS_STARTED: Workflow "${workflow.name}" started by user ${userId}`,
                        processInstanceId: instance.id,
                        userId
                    }
                });

                return { instanceId: instance.id, taskId: task.id, assignedTo: nodeRole };
            }, { maxWait: 15000, timeout: 30000 });

            // Execute side effects outside transaction
            for (const effect of sideEffects) {
                if (effect.type === 'NOTIFY') {
                    await notificationService.createNotification(effect.userId, effect.message, 'TASK_CREATED').catch(console.error);
                }
            }

            console.log('✅ Processus créé avec succès');
            return result;
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du processus métier :', error);
            throw error;
        }
    },

    /**
     * Completes a task and dynamically identifies the next step using AI-generated logic.
     */
    async completeTaskAndMoveToNext(taskId: string, action: 'APPROVE' | 'REJECT', userId: string) {
        let sideEffects: any[] = [];
        const result = await prisma.$transaction(async (tx) => {
            const task = await tx.task.findUnique({
                where: { id: taskId },
                include: {
                    processInstance: { include: { workflow: true } },
                    step: true
                }
            });

            if (!task || task.status !== 'PENDING') throw new Error("Task is invalid or already completed.");

            const { processInstance } = task;
            const context = processInstance.context as any;

            await tx.task.update({
                where: { id: taskId },
                data: {
                    status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
                    completedAt: new Date()
                }
            });

            if (action === 'REJECT') {
                await tx.processInstance.update({
                    where: { id: processInstance.id },
                    data: { status: 'REJECTED' }
                });
                return { status: 'TERMINATED', reason: 'REJECTED' };
            }

            const nodes = (processInstance.workflow.nodes as any[]) || [];
            const edges = (processInstance.workflow.edges as any[]) || [];

            const stepMetadata = task.step.metadata as any;
            const currentNode = nodes.find(n =>
                n.id === stepMetadata?.nodeId ||
                n.data?.title?.toLowerCase().trim() === task.step.name.toLowerCase().trim()
            );

            if (!currentNode) throw new Error(`Node not found for step: ${task.step.name}`);

            const resolveNextNode = (nodeId: string): any => {
                const outgoingEdges = edges.filter(e => e.source === nodeId);
                if (outgoingEdges.length === 0) return null;

                const node = nodes.find(n => n.id === nodeId);
                if (node?.data?.variant === 'condition' || node?.data?.variant === 'decision') {
                    const { condition } = node.data;
                    if (condition && condition.variable) {
                        const val = context[condition.variable];
                        const targetVal = condition.value;
                        let isTrue = false;
                        switch (condition.operator) {
                            case '===': isTrue = String(val) === String(targetVal); break;
                            case '>': isTrue = Number(val) > Number(targetVal); break;
                            case '<': isTrue = Number(val) < Number(targetVal); break;
                            case '!=': isTrue = String(val) !== String(targetVal); break;
                        }
                        const edge = outgoingEdges.find(e => e.sourceHandle === (isTrue ? 'true' : 'false')) || outgoingEdges[0];
                        return nodes.find(n => n.id === edge.target);
                    }
                }

                let edge = outgoingEdges[0];
                if (outgoingEdges.length > 1) {
                    edge = outgoingEdges.find(e => evaluateCondition(e.label || e.condition, context)) || outgoingEdges[0];
                }
                return nodes.find(n => n.id === edge.target);
            };

            let nextNode = resolveNextNode(currentNode.id);

            // Automated nodes processing (including 'system' role check in next steps)
            while (nextNode) {
                const isSystemNode = nextNode.role?.toLowerCase() === 'system' || nextNode.data?.role?.toLowerCase() === 'system';
                const isAutomatedVariant = ['email', 'webhook', 'document', 'timer'].includes(nextNode.data?.variant);

                if (isAutomatedVariant || isSystemNode) {
                    console.log(`[WorkflowEngine] Processing automated node: ${nextNode.id} (Role: ${nextNode.role || 'N/A'})`);

                    if (nextNode.data?.variant === 'document' || isSystemNode) {
                        sideEffects.push({ type: 'CERTIFICATE', instanceId: processInstance.id });
                    }
                    if (nextNode.data?.variant === 'email') {
                        sideEffects.push({ type: 'EMAIL', to: nextNode.data.to, subject: nextNode.data.subject, body: nextNode.data.body });
                    }

                    await tx.eventLog.create({
                        data: {
                            action: `AUTO_STEP: Executed for node ${nextNode.id}`,
                            processInstanceId: processInstance.id
                        }
                    });

                    nextNode = resolveNextNode(nextNode.id);
                } else {
                    break; // Human task or end node
                }
            }

            if (!nextNode || nextNode.data?.variant === 'end' || nextNode.type === 'end') {
                await tx.processInstance.update({ where: { id: processInstance.id }, data: { status: 'COMPLETED' } });
                sideEffects.push({ type: 'CERTIFICATE', instanceId: processInstance.id });
                return { status: 'COMPLETED' };
            }

            const nextRole = nextNode.data?.role || nextNode.role || "MANAGER";
            const assignedUser = await findUserByFlexibleRole(nextRole, processInstance.workflow.organisationId, tx);
            const nextStepName = nextNode.data?.title || nextNode.data?.label || "Next Validation";

            let targetStep = await tx.step.findFirst({ where: { workflowId: processInstance.workflowId, name: nextStepName } });
            if (!targetStep) {
                const lastStep = await tx.step.findFirst({ where: { workflowId: processInstance.workflowId }, orderBy: { order: 'desc' } });
                targetStep = await tx.step.create({
                    data: {
                        name: nextStepName,
                        workflowId: processInstance.workflowId,
                        order: (lastStep?.order || 0) + 1,
                        metadata: { nodeId: nextNode.id, role: nextRole }
                    }
                });
            }

            const nextTask = await tx.task.create({
                data: {
                    title: nextStepName,
                    status: "PENDING",
                    processInstanceId: processInstance.id,
                    stepId: targetStep.id,
                    organisationId: processInstance.workflow.organisationId,
                    userId: (assignedUser && assignedUser.id !== 'SYSTEM') ? assignedUser.id : null
                }
            });

            if (assignedUser && assignedUser.id !== 'SYSTEM') {
                sideEffects.push({ type: 'NOTIFY', userId: assignedUser.id, message: `New Task: ${nextStepName}` });
            }

            return { status: 'ADVANCED', nextTaskId: nextTask.id, assignedTo: nextRole };
        }, { maxWait: 15000, timeout: 30000 });

        // Execute side effects outside transaction
        for (const effect of sideEffects) {
            try {
                if (effect.type === 'NOTIFY') await notificationService.createNotification(effect.userId, effect.message, 'TASK_CREATED');
                if (effect.type === 'CERTIFICATE') await certificateService.generateCertificate(effect.instanceId);
                if (effect.type === 'EMAIL') await mailService.sendGenericEmail(effect.to, effect.subject, effect.body);
            } catch (err) {
                console.error(`[WorkflowEngine] Side effect ${effect.type} failed:`, err);
            }
        }

        return result;
    },

    /**
     * Approves a task (alias for completeTaskAndMoveToNext with 'APPROVE')
     */
    async approveTask(taskId: string, userId: string) {
        return this.completeTaskAndMoveToNext(taskId, 'APPROVE', userId);
    }
};