import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { notificationController } from "../controllers/notification.controller";

const notificationRouter = Router();

// All routes require authentication
notificationRouter.use(authMiddleware);

notificationRouter.get("/", notificationController.getNotifications);
notificationRouter.patch("/read-all", notificationController.markAllAsRead);

export default notificationRouter;
