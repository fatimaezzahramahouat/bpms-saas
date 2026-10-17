import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { notificationService } from "../services/notification.service";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

export const notificationController = {
    /**
     * GET /api/notifications
     * Returns all unread notifications for the logged-in user.
     */
    getNotifications: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = authReq.user?.id;

        if (!id) {
            throw new AppError("User not authenticated", 401);
        }

        const notifications = await notificationService.getUnreadNotifications(id);
        res.status(200).json({ data: notifications });
    }),

    /**
     * PATCH /api/notifications/read-all
     * Marks all notifications for the logged-in user as read.
     */
    markAllAsRead: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = authReq.user?.id;

        if (!id) {
            throw new AppError("User not authenticated", 401);
        }

        await notificationService.markAllAsRead(id);
        res.status(200).json({ message: "All notifications marked as read" });
    }),
};
