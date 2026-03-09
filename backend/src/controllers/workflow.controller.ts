import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { workflowService } from "../services/workflow.service";
import {
    createWorkflowSchema,
    updateWorkflowSchema,
    addStepSchema,
} from "../schemas/workflow.schema";

// ─── Helpers ──────────────────────────────────────────────

/** Extract organisationId from the JWT payload (set by authMiddleware). */
const getOrgId = (req: Request): string => {
    const authReq = req as AuthRequest;
    const organisationId = authReq.user?.organisationId;
    if (!organisationId) throw new Error("Unauthorized: missing organisationId in token");
    return organisationId;
};

// ─── Controller ───────────────────────────────────────────

export const workflowController = {
    /**
     * POST /api/workflows
     * Creates a workflow + initial steps in one atomic call.
     */
    createWorkflow: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);

        const parsed = createWorkflowSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }

        try {
            console.log(`[WorkflowController] Creating new workflow for org ${organisationId}`);
            const workflow = await workflowService.createWorkflow(
                organisationId,
                parsed.data
            );

            res.status(201).json({
                message: "Workflow created successfully",
                data: workflow, // Full object returned
            });
        } catch (error: any) {
            console.error('Workflow creation error:', error);
            const statusCode = error.message.includes("Validation failed") ? 400 : 500;
            res.status(statusCode).json({
                error: statusCode === 400 ? "Validation Error" : "Internal Server Error",
                message: error.message
            });
        }
    }),

    /**
     * GET /api/workflows
     * Returns all workflows for the authenticated organisation.
     */
    getAllWorkflows: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);

        const workflows = await workflowService.getAllWorkflows(organisationId);

        res.status(200).json({ data: workflows });
    }),

    /**
     * GET /api/workflows/:id
     * Returns a single workflow with its steps and rules.
     * Returns 404 if not found or belongs to another org.
     */
    getWorkflowById: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);
        const id = req.params.id as string;

        const workflow = await workflowService.getWorkflowById(id, organisationId);
        if (!workflow) {
            res.status(404).json({ error: "Workflow not found" });
            return;
        }

        res.status(200).json({ data: workflow });
    }),

    /**
     * PUT /api/workflows/:id
     * Updates the workflow name.
     * Returns 404 if not found or belongs to another org.
     */
    updateWorkflow: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = req.params.id as string;
        console.log(`[WorkflowController] Updating workflow ${id}`);
        console.log("Request Body:", JSON.stringify(req.body, null, 2));

        const organisationId = getOrgId(req);

        // We use safeParse to validate the basic structure
        const parsed = updateWorkflowSchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("Validation failed:", parsed.error.flatten().fieldErrors);
            res.status(400).json({
                error: "Validation Error",
                errors: parsed.error.flatten().fieldErrors
            });
            return;
        }

        try {
            const { nodes, edges, name, description, status } = parsed.data;

            // Directly updating using prisma for convenience as requested
            // while still respecting the org isolation
            console.log(`[WorkflowController] Attempting UPDATE for workflow ${id} (Org: ${organisationId})`);
            const workflow = await workflowService.updateWorkflow(
                id,
                organisationId,
                {
                    nodes,
                    edges,
                    name,
                    description,
                    status
                }
            );

            if (!workflow) {
                console.error(`[WorkflowController] Workflow ${id} non trouvé ou n'appartient pas à l'organisation ${organisationId}`);
                res.status(404).json({ error: "Workflow not found or unauthorized" });
                return;
            }

            res.status(200).json({
                message: "Workflow updated successfully",
                data: workflow,
            });
        } catch (error: any) {
            console.error('Workflow update error:', error);
            res.status(500).json({
                error: "Internal Server Error",
                message: error.message
            });
        }
    }),

    /**
     * DELETE /api/workflows/:id
     * Deletes a workflow and all its dependent data.
     * Returns 404 if not found or belongs to another org.
     */
    deleteWorkflow: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);
        const id = req.params.id as string;

        const deleted = await workflowService.deleteWorkflow(id, organisationId);
        if (!deleted) {
            res.status(404).json({ error: "Workflow not found" });
            return;
        }

        res.status(204).send();
    }),

    /**
     * POST /api/workflows/:id/steps
     * Adds a new step to an existing workflow.
     */
    addStep: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);
        const workflowId = req.params.id as string;

        const parsed = addStepSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }

        const step = await workflowService.addStep(
            workflowId,
            organisationId,
            parsed.data
        );
        if (!step) {
            res.status(404).json({ error: "Workflow not found" });
            return;
        }

        res.status(201).json({
            message: "Step added successfully",
            data: step,
        });
    }),

    /**
     * PATCH /api/workflows/:id/publish
     * Validates graph connectivity and marks workflow as ACTIVE.
     */
    publishWorkflow: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);
        const id = req.params.id as string;

        try {
            const workflow = await workflowService.publishWorkflow(id, organisationId);
            res.status(200).json({
                message: "Workflow published successfully",
                data: workflow,
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }),

    /**
     * DELETE /api/workflows/:id/steps/:stepId
     * Removes a step from a workflow.
     */
    deleteStep: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(req);
        const stepId = req.params.stepId as string;

        const deleted = await workflowService.deleteStep(stepId, organisationId);
        if (!deleted) {
            res.status(404).json({ error: "Step not found" });
            return;
        }

        res.status(204).send();
    }),
};
