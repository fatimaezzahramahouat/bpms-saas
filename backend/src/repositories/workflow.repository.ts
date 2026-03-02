import prisma from "../lib/prisma";
import { StepInput } from "../schemas/workflow.schema";

// ─── Input Types ──────────────────────────────────────────

interface CreateWorkflowData {
    name: string;
    description?: string;
    nodes?: any;
    edges?: any;
    steps: StepInput[];
}

interface UpdateWorkflowData {
    name?: string;
    description?: string;
    nodes?: any;
    edges?: any;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    version?: number;
}

interface AddStepData {
    name: string;
    order: number;
    metadata?: any;
}

// ─── Repository ───────────────────────────────────────────

export const workflowRepository = {
    /**
     * Creates a Workflow and its Steps in a single atomic transaction.
     * organisationId is always embedded to guarantee tenant isolation.
     */
    async createWorkflowWithSteps(
        organisationId: string,
        data: CreateWorkflowData
    ) {
        return prisma.$transaction(async (tx: any) => {
            // 1. Create the workflow
            const workflow = await tx.workflow.create({
                data: {
                    name: data.name,
                    description: data.description,
                    nodes: data.nodes || [],
                    edges: data.edges || [],
                    organisationId,
                },
            });

            // 2. Create all steps linked to the workflow
            if (data.steps.length > 0) {
                await tx.step.createMany({
                    data: data.steps.map((step) => ({
                        name: step.name,
                        order: step.order,
                        workflowId: workflow.id,
                        metadata: step.metadata || null,
                    })),
                });
            }

            // 3. Return the workflow with its newly created steps
            return tx.workflow.findUnique({
                where: { id: workflow.id },
                include: {
                    steps: {
                        orderBy: { order: "asc" },
                    },
                },
            });
        });
    },

    /**
     * Returns all workflows for a given organisation,
     * including step count via _count.
     */
    async findAllByOrg(organisationId: string) {
        return prisma.workflow.findMany({
            where: { organisationId },
            include: {
                _count: { select: { steps: true, instances: true } },
            },
            orderBy: { name: "asc" },
        });
    },

    /**
     * Returns a single workflow with full step and rule details.
     * Returns null if not found OR if it belongs to a different org.
     */
    async findByIdAndOrg(id: string, organisationId: string) {
        return prisma.workflow.findFirst({
            where: { id, organisationId },
            include: {
                steps: {
                    orderBy: { order: "asc" },
                    include: { rules: true },
                },
                _count: { select: { instances: true } },
            },
        });
    },

    /**
     * Updates the workflow name. The organisationId check in `where`
     * ensures a user cannot rename a workflow from another org.
     */
    async updateWorkflow(
        id: string,
        organisationId: string,
        data: UpdateWorkflowData
    ) {
        return prisma.workflow.updateMany({
            where: { id, organisationId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.nodes !== undefined && { nodes: data.nodes }),
                ...(data.edges !== undefined && { edges: data.edges }),
                ...(data.status && { status: data.status }),
                ...(data.version && { version: data.version }),
            },
        });
    },

    /**
     * Returns the updated workflow after a rename, verifying org ownership.
     */
    async findByIdAfterUpdate(id: string, organisationId: string) {
        return prisma.workflow.findFirst({
            where: { id, organisationId },
            include: {
                steps: { orderBy: { order: "asc" } },
            },
        });
    },

    /**
     * Deletes a workflow by id scoped to the org.
     * Steps, Tasks, ProcessInstances cascade via Prisma schema relations.
     */
    async deleteWorkflow(id: string, organisationId: string) {
        const result = await prisma.workflow.deleteMany({
            where: { id, organisationId },
        });
        return result.count > 0;
    },

    /**
     * Adds a step to a workflow after verifying the workflow belongs to the org.
     */
    async addStep(
        workflowId: string,
        organisationId: string,
        data: AddStepData
    ) {
        // Security: verify the workflow belongs to this org before mutating
        const workflow = await prisma.workflow.findFirst({
            where: { id: workflowId, organisationId },
        });

        if (!workflow) return null;

        return prisma.step.create({
            data: {
                name: data.name,
                order: data.order,
                workflowId,
                metadata: data.metadata || null,
            },
        });
    },

    /**
     * Deletes a step, verifying org ownership by joining through the workflow.
     */
    async deleteStep(stepId: string, organisationId: string) {
        // Verify the step belongs to a workflow owned by this org
        const step = await prisma.step.findFirst({
            where: {
                id: stepId,
                workflow: { organisationId },
            },
        });

        if (!step) return false;

        await prisma.step.delete({ where: { id: stepId } });
        return true;
    },
};
