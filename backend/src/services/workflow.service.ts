import { workflowRepository } from "../repositories/workflow.repository";
import { CreateWorkflowInput, UpdateWorkflowInput, AddStepInput } from "../schemas/workflow.schema";

// ─── Service ──────────────────────────────────────────────

export const workflowService = {
    /**
     * Creates a workflow with its initial steps.
     * Business rule: if no steps are provided by the caller,
     * auto-create a single default "Step 1" so a workflow is never empty.
     */
    async createWorkflow(organisationId: string, input: CreateWorkflowInput) {
        const workflow = await workflowRepository.createWorkflowWithSteps(
            organisationId,
            {
                name: input.name,
                description: input.description,
                nodes: input.nodes,
                edges: input.edges,
                steps: input.steps || [],
            }
        );

        return workflow;
    },

    /**
     * Returns a list of all workflows for the organisation.
     */
    async getAllWorkflows(organisationId: string) {
        return workflowRepository.findAllByOrg(organisationId);
    },

    /**
     * Returns a single workflow with full step detail.
     * Returns null if the workflow does not exist or belongs to another org.
     */
    async getWorkflowById(id: string, organisationId: string) {
        return workflowRepository.findByIdAndOrg(id, organisationId);
    },

    /**
     * Renames a workflow. Returns null if not found / wrong org.
     */
    async updateWorkflow(
        id: string,
        organisationId: string,
        input: UpdateWorkflowInput
    ) {
        const current = await workflowRepository.findByIdAndOrg(id, organisationId);
        if (!current) return null;

        let version = current.version;
        // Business Rule: If editing an ACTIVE workflow, increment version
        if (current.status === "ACTIVE" && (input.nodes || input.edges || input.name)) {
            version += 1;
        }

        const result = await workflowRepository.updateWorkflow(id, organisationId, {
            ...input,
            version,
        });

        if (result.count === 0) return null;

        return workflowRepository.findByIdAfterUpdate(id, organisationId);
    },

    /**
     * Publication Logic:
     * - Verify presence of at least one 'trigger' and one 'end' node.
     * - Update status to ACTIVE.
     */
    async publishWorkflow(id: string, organisationId: string) {
        const workflow = await workflowRepository.findByIdAndOrg(id, organisationId);
        if (!workflow) return null;

        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
        const hasTrigger = nodes.some((n: any) => n.data?.variant === 'trigger');
        const hasEnd = nodes.some((n: any) => n.data?.variant === 'end');

        if (!hasTrigger || !hasEnd) {
            throw new Error("Workflow must have at least one Trigger and one End node to be published.");
        }

        await workflowRepository.updateWorkflow(id, organisationId, { status: "ACTIVE" });
        return workflowRepository.findByIdAndOrg(id, organisationId);
    },

    /**
     * Deletes a workflow and all its dependent data.
     * Returns false if not found / wrong org.
     */
    async deleteWorkflow(id: string, organisationId: string) {
        return workflowRepository.deleteWorkflow(id, organisationId);
    },

    /**
     * Adds a step to an existing workflow. Returns null if the workflow
     * does not exist or belongs to another org.
     */
    async addStep(
        workflowId: string,
        organisationId: string,
        input: AddStepInput
    ) {
        return workflowRepository.addStep(workflowId, organisationId, {
            name: input.name,
            order: input.order,
        });
    },

    /**
     * Removes a step. Returns false if not found or not owned by this org.
     */
    async deleteStep(stepId: string, organisationId: string) {
        return workflowRepository.deleteStep(stepId, organisationId);
    },
};
