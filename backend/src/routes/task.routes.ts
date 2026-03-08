import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { taskController } from "../controllers/task.controller";

const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.get("/", taskController.getTasks);
taskRouter.get("/approvals", taskController.getApprovals);
taskRouter.patch("/:id", taskController.updateTaskStatus);
taskRouter.patch("/:id/approve", taskController.approveTask);
taskRouter.patch("/:id/reject", taskController.rejectTask);

export default taskRouter;
