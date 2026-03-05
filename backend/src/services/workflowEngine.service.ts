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
            let targetStep = workflow.steps.find((s) => s.name === stepName);

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
    }
};

