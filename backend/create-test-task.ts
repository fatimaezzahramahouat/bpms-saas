import prisma from "./src/lib/prisma";

async function createTestTask(targetUserId: string) {
    try {
        // 1. Get User and Organisation
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: { organisation: true }
        });

        if (!user) {
            throw new Error(`User with ID ${targetUserId} not found.`);
        }

        const organisationId = user.organisationId;

        // 2. Ensure a Workflow exists
        let workflow = await prisma.workflow.findFirst({
            where: { organisationId }
        });

        if (!workflow) {
            console.log("No workflow found, creating a dummy one...");
            workflow = await prisma.workflow.create({
                data: {
                    name: "Test Workflow",
                    organisationId,
                    status: "ACTIVE",
                    description: "Workflow for testing purposes",
                    nodes: [],
                    edges: []
                }
            });
        }

        // 3. Ensure a Step exists
        let step = await prisma.step.findFirst({
            where: { workflowId: workflow.id }
        });

        if (!step) {
            console.log("No step found, creating a dummy one...");
            step = await prisma.step.create({
                data: {
                    name: "Validation Step",
                    order: 1,
                    workflowId: workflow.id
                }
            });
        }

        // 4. Ensure a ProcessInstance exists
        let processInstance = await prisma.processInstance.findFirst({
            where: { workflowId: workflow.id }
        });

        if (!processInstance) {
            console.log("No process instance found, creating a dummy one...");
            processInstance = await prisma.processInstance.create({
                data: {
                    workflowId: workflow.id,
                    status: "IN_PROGRESS"
                }
            });
        }

        // 5. Create the Task
        const task = await prisma.task.create({
            data: {
                title: "Tâche de test pour Dashboard",
                status: "PENDING",
                userId: targetUserId,
                processInstanceId: processInstance.id,
                stepId: step.id,
                organisationId: organisationId,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        });

        console.log("✅ Task created successfully:");
        console.log(JSON.stringify(task, null, 2));
        return task;

    } catch (error) {
        console.error("❌ Error creating test task:", error);
        throw error;
    }
}

// Execution with the confirmed ID
const TARGET_USER_ID = "d4f226c6-8139-4e10-b209-21df52ef4e28";

createTestTask(TARGET_USER_ID)
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
