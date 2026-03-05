import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { taskController } from "../controllers/task.controller";

const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.get("/", taskController.getTasks);
taskRouter.patch("/:id", taskController.updateTaskStatus);

export default taskRouter;
