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
        const steps =
            input.steps && input.steps.length > 0
                ? input.steps
                : [{ name: "Step 1", order: 1 }];

        const workflow = await workflowRepository.createWorkflowWithSteps(
            organisationId,
            { name: input.name, steps }
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
        const result = await workflowRepository.updateWorkflow(id, organisationId, {
            name: input.name,
        });

        if (result.count === 0) return null;

        return workflowRepository.findByIdAfterUpdate(id, organisationId);
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
