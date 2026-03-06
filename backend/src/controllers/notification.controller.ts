import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { notificationService } from "../services/notification.service";
import { catchAsync } from "../utils/catchAsync";

export const notificationController = {
    /**
     * GET /api/notifications
     * Returns all unread notifications for the logged-in user.
     */
    getNotifications: catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const notifications = await notificationService.getUnreadNotifications(userId);
        res.status(200).json({ data: notifications });
    }),

    /**
     * PATCH /api/notifications/read-all
     * Marks all notifications for the logged-in user as read.
     */
    markAllAsRead: catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        await notificationService.markAllAsRead(userId);
        res.status(200).json({ message: "All notifications marked as read" });
    }),
};
