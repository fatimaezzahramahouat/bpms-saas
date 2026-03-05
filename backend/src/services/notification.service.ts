import prisma from "../lib/prisma";

export const notificationService = {
    /**
     * Creates a new notification for a user.
     * @param userId ID of the user to notify
     * @param message Notification message
     * @param type Type of notification (e.g., 'TASK_CREATED', 'PROCESS_APPROVED')
     */
    async createNotification(userId: string, message: string, type: string) {
        try {
            return await prisma.notification.create({
                data: {
                    userId,
                    message,
                    type,
                    isRead: false,
                },
            });
        } catch (error) {
            console.error("[NotificationService] Error creating notification:", error);
            throw error;
        }
    },

    /**
     * Fetches unread notifications for a specific user.
     */
    async getUnreadNotifications(userId: string) {
        return prisma.notification.findMany({
            where: {
                userId,
                isRead: false,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },

    /**
     * Marks all notifications as read for a specific user.
     */
    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    },
};
