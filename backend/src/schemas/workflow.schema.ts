import { z } from "zod";

// ─── Step Sub-Schema ──────────────────────────────────────

const stepInputSchema = z.object({
    name: z.string().min(1, "Step name is required"),
    order: z
        .number({ message: "Order must be a number" })
        .int("Order must be an integer")
        .positive("Order must be a positive integer"),
    metadata: z.any().optional(), // Flexible JSON for React Flow data
});

// ─── Workflow Schemas ─────────────────────────────────────

/**
 * POST /api/workflows
 * Creates a workflow with its initial graph (nodes/edges) and steps.
 */
export const createWorkflowSchema = z.object({
    name: z.string().min(1, "Workflow name is required"),
    description: z.string().optional(),
    nodes: z.any().optional().default([]), // Expected to be an array of XYFlow nodes
    edges: z.any().optional().default([]), // Expected to be an array of XYFlow edges
    steps: z.array(stepInputSchema).optional(),
});

/**
 * PUT /api/workflows/:id
 * Updates name, description, graph, or status.
 */
export const updateWorkflowSchema = z.object({
    name: z.string().min(1, "Workflow name is required").optional(),
    description: z.string().optional(),
    nodes: z.any().optional(),
    edges: z.any().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
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
