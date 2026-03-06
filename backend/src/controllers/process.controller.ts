import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { workflowEngineService } from "../services/workflowEngine.service";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";

export const processController = {
    /**
     * POST /api/process/start
     * Starts a new process instance for a workflow.
     */
    startProcess: catchAsync(async (req: AuthRequest, res: Response) => {
        const { workflowId, startDate, endDate, reason } = req.body;
        const file = req.file;
        const userId = req.user?.userId;
        const organisationId = req.user?.organisationId;

        if (!userId || !organisationId) {
            return res.status(401).json({ error: "User not authenticated or missing organisation" });
        }

        if (!workflowId) {
            return res.status(400).json({ error: "workflowId is required" });
        }

        try {
            const result = await workflowEngineService.startProcessInstance(
                workflowId,
                userId,
                organisationId,
                { startDate, endDate, reason, file }
            );

            res.status(201).json({
                message: "Process started successfully",
                data: result
            });
        } catch (error: any) {
            console.error("[ProcessController] Error starting process:", error);
            res.status(400).json({ error: error.message });
        }
    }),
    /**
     * GET /api/process/my-requests
     * Returns all process instances initiated by the logged-in user.
     */
    getMyRequests: catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const requests = await prisma.processInstance.findMany({
            where: { userId },
            include: {
                workflow: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(requests);
    })
};
