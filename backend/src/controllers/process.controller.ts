import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { workflowEngineService } from "../services/workflowEngine.service";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

export const processController = {
    /**
     * POST /api/process/start
     * Starts a new process instance for a workflow.
     */
    startProcess: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const { workflowId, metadata, startDate, endDate, reason } = req.body;
        const file = req.file;
        const id = authReq.user?.id;
        const organisationId = authReq.user?.organisationId;

        if (!id || !organisationId) {
            throw new AppError("User not authenticated or missing organisation", 401);
        }

        if (!workflowId) {
            throw new AppError("workflowId is required", 400);
        }

        // Check Context/Metadata: Ensure it is a valid object and not null
        let finalMetadata = metadata;

        // Parse metadata if sent as JSON string in FormData
        if (typeof metadata === 'string') {
            try {
                finalMetadata = JSON.parse(metadata);
            } catch (e) {
                finalMetadata = {};
            }
        }

        // Ensure finalMetadata is an object and not null
        if (!finalMetadata || typeof finalMetadata !== 'object' || Array.isArray(finalMetadata)) {
            finalMetadata = {};
        }

        // Backwards compatibility for legacy LeaveRequestForm
        if (startDate || endDate || reason) {
            finalMetadata = { ...finalMetadata, startDate, endDate, reason };
        }
        if (file) {
            finalMetadata.file = file;
        }

        const result = await workflowEngineService.startProcessInstance(
            workflowId,
            id,
            organisationId,
            finalMetadata
        );

        res.status(201).json({
            message: "Process started successfully",
            data: result
        });
    }),
    /**
     * GET /api/process/my-requests
     * Returns all process instances initiated by the logged-in user.
     */
    getMyRequests: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = authReq.user?.id;

        if (!id) {
            throw new AppError("User not authenticated", 401);
        }

        const requests = await prisma.processInstance.findMany({
            where: { userId: id },
            include: {
                workflow: {
                    select: { name: true }
                },
                documents: true,
                tasks: {
                    where: { status: 'PENDING' },
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(requests);
    })
};
