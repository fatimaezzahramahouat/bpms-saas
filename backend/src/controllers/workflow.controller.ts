import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
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
    if (!organisationId) throw new AppError("Unauthorized: missing organisationId in token", 401);
    return organisationId;
};

// ─── Controller ───────────────────────────────────────────

export const workflowController = {
    /**
     * POST /api/workflows
     * Creates a workflow + initial steps in one atomic call.
     */
    createWorkflow: catchAsync(async (req: Request, res: Response) => {
        const organisationId = getOrgId(req);

        const parsed = createWorkflowSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }

        const workflow = await workflowService.createWorkflow(
            organisationId,
            parsed.data
        );

        res.status(201).json({
            message: "Workflow created successfully",
            data: workflow, // Full object returned
        });
    }),

    /**
     * GET /api/workflows
     * Returns all workflows for the authenticated organisation.
     */
    getAllWorkflows: catchAsync(async (req: Request, res: Response) => {
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
        const organisationId = getOrgId(req);
        const id = req.params.id as string;

        const workflow = await workflowService.getWorkflowById(id, organisationId);
        if (!workflow) {
            throw new AppError("Workflow not found", 404);
        }

        res.status(200).json({ data: workflow });
    }),

    /**
     * PUT /api/workflows/:id
     * Updates the workflow name.
     * Returns 404 if not found or belongs to another org.
     */
    updateWorkflow: catchAsync(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organisationId = getOrgId(req);

        // We use safeParse to validate the basic structure
        const parsed = updateWorkflowSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation Error",
                errors: parsed.error.flatten().fieldErrors
            });
            return;
        }

        const { nodes, edges, name, description, status, data_model } = parsed.data;

        const workflow = await workflowService.updateWorkflow(
            id,
            organisationId,
            {
                nodes,
                edges,
                name,
                description,
                status,
                data_model
            }
        );

        if (!workflow) {
            throw new AppError("Workflow not found or unauthorized", 404);
        }

        res.status(200).json({
            message: "Workflow updated successfully",
            data: workflow,
        });
    }),

    /**
     * DELETE /api/workflows/:id
     * Deletes a workflow and all its dependent data.
     * Returns 404 if not found or belongs to another org.
     */
    deleteWorkflow: catchAsync(async (req: Request, res: Response) => {
        const organisationId = getOrgId(req);
        const id = req.params.id as string;

        const deleted = await workflowService.deleteWorkflow(id, organisationId);
        if (!deleted) {
            throw new AppError("Workflow not found", 404);
        }

        res.status(204).send();
    }),

    /**
     * POST /api/workflows/:id/steps
     * Adds a new step to an existing workflow.
     */
    addStep: catchAsync(async (req: Request, res: Response) => {
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
            throw new AppError("Workflow not found", 404);
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
        const organisationId = getOrgId(req);
        const id = req.params.id as string;

        try {
            const workflow = await workflowService.publishWorkflow(id, organisationId);
            if (!workflow) {
                throw new AppError("Workflow not found", 404);
            }
            res.status(200).json({
                message: "Workflow published successfully",
                data: workflow,
            });
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, 400);
        }
    }),

    /**
     * DELETE /api/workflows/:id/steps/:stepId
     * Removes a step from a workflow.
     */
    deleteStep: catchAsync(async (req: Request, res: Response) => {
        const organisationId = getOrgId(req);
        const stepId = req.params.stepId as string;

        const deleted = await workflowService.deleteStep(stepId, organisationId);
        if (!deleted) {
            throw new AppError("Step not found", 404);
        }

        res.status(204).send();
    }),
};
