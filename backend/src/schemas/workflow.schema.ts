import { z } from "zod";

// ─── Step Sub-Schema ──────────────────────────────────────

const stepInputSchema = z.object({
    name: z.string().min(1, "Step name is required"),
    order: z
        .number({ message: "Order must be a number" })
        .int("Order must be an integer")
        .positive("Order must be a positive integer"),
});

// ─── Workflow Schemas ─────────────────────────────────────

/**
 * POST /api/workflows
 * Creates a workflow and optionally its initial steps.
 * If `steps` is omitted, the service auto-creates "Step 1".
 */
export const createWorkflowSchema = z.object({
    name: z.string().min(1, "Workflow name is required"),
    steps: z.array(stepInputSchema).optional(),
});

/**
 * PUT /api/workflows/:id
 * Partial update — only the workflow name for now.
 * Steps are managed via dedicated step endpoints.
 */
export const updateWorkflowSchema = z.object({
    name: z.string().min(1, "Workflow name is required"),
});

/**
 * POST /api/workflows/:id/steps
 * Adds a single step to an existing workflow.
 */
export const addStepSchema = stepInputSchema;

// ─── Inferred Types ───────────────────────────────────────

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type AddStepInput = z.infer<typeof addStepSchema>;
export type StepInput = z.infer<typeof stepInputSchema>;
