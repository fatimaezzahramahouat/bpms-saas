import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { workflowController } from "../controllers/workflow.controller";

const workflowRouter = Router();

// All workflow routes require a valid JWT
workflowRouter.use(authMiddleware);

// ─── Workflow CRUD ────────────────────────────────────────
workflowRouter.post("/", workflowController.createWorkflow);
workflowRouter.get("/", workflowController.getAllWorkflows);
workflowRouter.get("/:id", workflowController.getWorkflowById);
workflowRouter.put("/:id", workflowController.updateWorkflow);
workflowRouter.delete("/:id", workflowController.deleteWorkflow);

// ─── Step Management ──────────────────────────────────────
workflowRouter.post("/:id/steps", workflowController.addStep);
workflowRouter.delete("/:id/steps/:stepId", workflowController.deleteStep);

export default workflowRouter;
