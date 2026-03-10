import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";
import { workflowEngineService } from "../services/workflowEngine.service";
import { catchAsync } from "../utils/catchAsync";

export const taskController = {
    /**
     * Gets all pending tasks for the logged-in user.
     */
    getTasks: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const currentUserId = authReq.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const tasks = await prisma.task.findMany({
            where: {
                userId: currentUserId,
                status: "PENDING"
            },
            include: {
                processInstance: {
                    include: {
                        application: {
                            include: {
                                candidate: true,
                                jobOffer: true,
                                documents: true // Include documents for the employee to review
                            }
                        },
                        workflow: {
                            include: {
                                _count: {
                                    select: { steps: true } // used for progress bar total
                                }
                            }
                        },
                        aiAnalyses: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        },
                        _count: {
                            select: { tasks: { where: { status: "COMPLETED" } } } // used for progress bar current
                        }
                    }
                },
                step: true
            },
            orderBy: { dueDate: "asc" } // Sort by dueDate as requested
        });

        res.status(200).json(tasks);
    }),

    /**
     * Updates a task's status and potentially advances the workflow.
     */
    updateTaskStatus: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const { id } = req.params as { id: string };
        const { action } = req.body; // 'APPROVE' | 'REJECT'
        const currentUserId = authReq.user?.id as string;

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ error: "Invalid action. Must be 'APPROVE' or 'REJECT'." });
        }

        const result = await workflowEngineService.completeTaskAndMoveToNext(id, action, currentUserId);

        res.status(200).json({
            message: `Task ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`,
            ...result
        });
    }),

    /**
     * PATCH /api/tasks/:id/approve
     * Approves the task and moves to next step.
     */
    approveTask: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = req.params.id as string;
        const currentUserId = authReq.user?.id;

        if (!id || !currentUserId) return res.status(401).json({ error: "Unauthorized or missing ID" });

        const result = await workflowEngineService.approveTask(id, currentUserId);

        res.status(200).json({
            message: "Task approved successfully",
            data: result
        });
    }),

    /**
     * PATCH /api/tasks/:id/reject
     * Rejects the task and terminates the process.
     */
    rejectTask: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = req.params.id as string;
        const currentUserId = authReq.user?.id;

        if (!id || !currentUserId) return res.status(401).json({ error: "Unauthorized or missing ID" });

        const result = await workflowEngineService.completeTaskAndMoveToNext(id, 'REJECT', currentUserId);

        res.status(200).json({
            message: "Task rejected successfully",
            data: result
        });
    }),

    /**
     * GET /api/tasks/approvals
     * Gets all pending tasks assigned to the manager for review.
     */
    getApprovals: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const currentUserId = authReq.user?.id;
        const organisationId = authReq.user?.organisationId;

        if (!currentUserId || !organisationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }


        const tasks = await prisma.task.findMany({
            where: {
                userId: currentUserId,
                status: "PENDING"
            },
            include: {

                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                processInstance: {
                    include: {
                        user: true,
                        workflow: true
                    }
                },
                step: true
            },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json(tasks);
    })
};
