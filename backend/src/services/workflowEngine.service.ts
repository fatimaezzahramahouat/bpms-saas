import prisma from "../lib/prisma";

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
        });

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
        return await prisma.$transaction(async (tx) => {
            const workflow = await tx.workflow.findUnique({
                where: { id: workflowId }
            });

            if (!workflow || workflow.organisationId !== organisationId) {
                console.error(`[WorkflowEngine] Workflow start failed. ID: ${workflowId}, Org: ${organisationId}, Found: ${!!workflow}, OwnerOrg: ${workflow?.organisationId}`);
                throw new Error(`Workflow not found or unauthorized for your organisation.`);
            }

            // Fetch Initiator Name
            const initiator = await tx.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true, email: true }
            });
            const initiatorName = initiator ? `${initiator.firstName} ${initiator.lastName}` : "Inconnu";

            // Specialized Logic for DEMANDE DE CONGE
            if (workflow.name.toUpperCase().includes("CONGE") || workflow.name.toUpperCase().includes("CONGÉ")) {
                console.log("[WorkflowEngine] Executing specialized Leave Request logic...");

                // 1. Save Document if present
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

                // 2. Create Process Instance
                const instance = await tx.processInstance.create({
                    data: {
                        workflowId: workflow.id,
                        userId, // Added userId to track initiator
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

                // 3. Simulated API Call (check-1772677404703)
                console.log("[WorkflowEngine] Node check-1772677404703: Verifying leave balance...");

                // 4. Condition Logic (cond-1772677404703)
                const start = metadata?.startDate ? new Date(metadata.startDate) : new Date();
                const end = metadata?.endDate ? new Date(metadata.endDate) : new Date();
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                console.log(`[WorkflowEngine] Node cond-1772677404703: Duration = ${diffDays} days`);

                // 5. Create Manager Task (manager-1772677404703)
                const manager = await tx.user.findFirst({
                    where: { organisationId, manager: { isNot: null } }
                });

                const steps = await tx.step.findMany({ where: { workflowId: workflow.id } });
                let managerStep = steps.find((s: any) => s.name.toUpperCase().includes("MANAGER"));
                if (!managerStep && steps.length > 0) managerStep = steps[0];

                const task = await tx.task.create({
                    data: {
                        title: `Validation Congé: ${diffDays} jours`,
                        status: "PENDING",
                        processInstanceId: instance.id,
                        stepId: managerStep?.id || "default-step-id", // Use a safer fallback or handle missing step
                        organisationId,
                        userId: manager?.id || null
                    }
                });

                return { instanceId: instance.id, taskId: task.id, assignedTo: "MANAGER" };
            }

            // Default Generic Logic
            const instance = await tx.processInstance.create({
                data: {
                    workflowId: workflow.id,
                    userId, // Added userId to track initiator
                    status: "IN_PROGRESS",
                    context: {
                        initiatorName,
                        initiatorEmail: initiator?.email || ""
                    }
                }
            });

            const task = await this.createInitialTask(workflowId, instance.id, organisationId, tx);

            await tx.eventLog.create({
                data: {
                    action: `PROCESS_STARTED: Workflow "${workflow.name}" started by user ${userId}`,
                    processInstanceId: instance.id,
                    userId
                }
            });

            return {
                instanceId: instance.id,
                taskId: task.id,
                assignedTo: "MANAGER"
            };
        });
    },

    /**
     * Completes a task and moves the workflow to the next step.
     */
    async completeTaskAndMoveToNext(taskId: string, action: 'APPROVE' | 'REJECT', userId: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Fetch the Task
            const task = await tx.task.findUnique({
                where: { id: taskId },
                include: {
                    processInstance: {
                        include: {
                            workflow: true,
                            application: true
                        }
                    },
                    step: true
                }
            });

            if (!task) throw new Error("Task not found.");
            if (task.status !== 'PENDING') throw new Error("Task is already completed.");

            const { processInstance } = task;
            const { workflow, application } = processInstance;

            // 2. Mark the current task as completed
            await tx.task.update({
                where: { id: taskId },
                data: {
                    status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
                    completedAt: new Date(),
                }
            });

            // 3. Handle REJECTION
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
                        action: `TASK_REJECTED: Task "${task.title}" rejected by user ${userId}. Workflow terminated.`,
                        processInstanceId: processInstance.id,
                        userId
                    }
                });

                return { status: 'TERMINATED', reason: 'REJECTED' };
            }

            // 4. Handle APPROVAL: Find next node
            const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
            const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : [];

            // Find current node in React Flow (matched by title/label)
            const currentNode = nodes.find(n => n.data?.title === task.step.name || n.data?.label === task.step.name);

            if (!currentNode) {
                throw new Error("Could not find the current step node in the workflow graph.");
            }

            const outgoingEdge = edges.find(e => e.source === currentNode.id);

            // 5. If no outgoing edge, we are at the END
            if (!outgoingEdge) {
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

            // 6. Find next node
            const nextNode = nodes.find(n => n.id === outgoingEdge.target);
            if (!nextNode || nextNode.data?.variant === 'end') {
                // Finalize if next node is END
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

            // 7. Map next node to a Step in DB
            const nextStepName = nextNode.data?.title || nextNode.data?.label;
            const targetStep = await tx.step.findFirst({
                where: { workflowId: workflow.id, name: nextStepName }
            });

            if (!targetStep) {
                throw new Error(`Step "${nextStepName}" not found in database for this workflow.`);
            }

            // 8. Assign to Next User (Manager by default if it's an approval step)
            // For now, we fetch the first Manager in the org or keep it unassigned
            const managerUser = await tx.user.findFirst({
                where: {
                    organisationId: workflow.organisationId,
                    manager: { isNot: null }
                }
            });

            // 9. Create the Next Task
            const nextTask = await tx.task.create({
                data: {
                    title: nextStepName || "Nouvelle étape",
                    status: "PENDING",
                    processInstanceId: processInstance.id,
                    stepId: targetStep.id,
                    organisationId: workflow.organisationId,
                    userId: managerUser?.id || null
                }
            });

            await tx.eventLog.create({
                data: {
                    action: `TASK_APPROVED: Task "${task.title}" approved. Next step: "${nextStepName}" created.`,
                    processInstanceId: processInstance.id,
                    userId
                }
            });

            return {
                status: 'ADVANCED',
                nextTaskId: nextTask.id,
                assignedTo: managerUser?.email || 'Unassigned'
            };
        });
    },

    /**
     * Approves a task (alias for completeTaskAndMoveToNext with 'APPROVE')
     */
    async approveTask(taskId: string, userId: string) {
        return this.completeTaskAndMoveToNext(taskId, 'APPROVE', userId);
    }
};

