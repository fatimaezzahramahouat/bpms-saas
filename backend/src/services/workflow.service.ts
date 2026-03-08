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
                data_model: input.data_model,
                steps: input.steps || [],
            }
        );

        return workflow;
    },

    /**
     * Returns a list of all workflows for the organisation.
     * Optionally filters by category and sorts by updatedAt descending.
     */
    async getAllWorkflows(organisationId: string, category?: string) {
        return workflowRepository.findAllByOrg(organisationId, category);
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
        if (current.status === "ACTIVE" && (input.nodes || input.edges || input.data_model || input.name)) {
            version += 1;
        }

        // Validation for nodes when saving (must contain Trigger and End)
        // Note: Removed strict enforcement here to allow partial saves during design.
        // Publication still enforces this.
        if (input.nodes) {
            const nodes = Array.isArray(input.nodes) ? input.nodes : [];
            const hasTrigger = nodes.some((n: any) => n.data?.variant === 'trigger');
            const hasEnd = nodes.some((n: any) => n.data?.variant === 'end');

            if (!hasTrigger || !hasEnd) {
                console.warn(`[WorkflowService] Warning: Workflow ${id} saved without Trigger/End node.`);
            }
        }

        const result = await workflowRepository.updateWorkflow(id, organisationId, {
            ...input,
            version,
        });

        if (!result) return null;

        return result;
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
     * Duplicates an existing workflow.
     */
    async duplicateWorkflow(id: string, organisationId: string) {
        const original = await workflowRepository.findByIdAndOrg(id, organisationId);
        if (!original) return null;

        // Create a new workflow copying key elements but resetting status/version
        const duplicated = await workflowRepository.createWorkflowWithSteps(
            organisationId,
            {
                name: `Copie de ${original.name}`,
                description: original.description || undefined,
                nodes: original.nodes,
                edges: original.edges,
                // Assuming "category" is part of the metadata or schema implicitly if added recently
                // Here we just pass the steps, any category logic should be added to the input if it exists
                steps: original.steps.map(s => ({
                    name: s.name,
                    order: s.order,
                    metadata: s.metadata,
                })),
            }
        );

        // explicitly set status to DRAFT and version to 1 in case createWorkflow defaults differently
        await workflowRepository.updateWorkflow(duplicated.id, organisationId, {
            status: "DRAFT",
            version: 1
        });

        return workflowRepository.findByIdAndOrg(duplicated.id, organisationId);
    },

    /**
     * Toggles the active status of a workflow between ACTIVE and DRAFT.
     */
    async toggleWorkflowStatus(id: string, organisationId: string) {
        const current = await workflowRepository.findByIdAndOrg(id, organisationId);
        if (!current) return null;

        const newStatus = current.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
        await workflowRepository.updateWorkflow(id, organisationId, { status: newStatus });

        return workflowRepository.findByIdAndOrg(id, organisationId);
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
