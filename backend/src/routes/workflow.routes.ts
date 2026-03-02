import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { workflowController } from "../controllers/workflow.controller";
import { validate } from "../middleware/validation.middleware";
import {
    createWorkflowSchema,
    updateWorkflowSchema,
    addStepSchema,
} from "../schemas/workflow.schema";

const workflowRouter = Router();

// All workflow routes require a valid JWT
workflowRouter.use(authMiddleware);

// ─── Workflow CRUD ────────────────────────────────────────
workflowRouter.post("/", validate(createWorkflowSchema), workflowController.createWorkflow);
workflowRouter.get("/", workflowController.getAllWorkflows);
workflowRouter.get("/:id", workflowController.getWorkflowById);
workflowRouter.put("/:id", validate(updateWorkflowSchema), workflowController.updateWorkflow);
workflowRouter.patch("/:id/publish", workflowController.publishWorkflow);
workflowRouter.delete("/:id", workflowController.deleteWorkflow);

// ─── Step Management ──────────────────────────────────────
workflowRouter.post("/:id/steps", validate(addStepSchema), workflowController.addStep);
workflowRouter.delete("/:id/steps/:stepId", workflowController.deleteStep);

export default workflowRouter;
