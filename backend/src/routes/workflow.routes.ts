import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { checkRole } from "../middleware/permission.middleware";
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

const EDITOR_ROLES = ['ADMIN', 'ADMINISTRATEUR', 'HR_MANAGER', 'RH', 'RESPONSABLE RH', 'HR'];

// ─── Workflow CRUD ────────────────────────────────────────
workflowRouter.post("/", checkRole(EDITOR_ROLES), validate(createWorkflowSchema), workflowController.createWorkflow);
workflowRouter.get("/", workflowController.getAllWorkflows);
workflowRouter.get("/:id", workflowController.getWorkflowById);
workflowRouter.put("/:id", checkRole(EDITOR_ROLES), validate(updateWorkflowSchema), workflowController.updateWorkflow);
// PATCH /:id — alias for PUT (used by the frontend editor "Save" button)
workflowRouter.patch("/:id", checkRole(EDITOR_ROLES), validate(updateWorkflowSchema), workflowController.updateWorkflow);
workflowRouter.patch("/:id/publish", checkRole(EDITOR_ROLES), workflowController.publishWorkflow);
workflowRouter.patch("/:id/toggle", checkRole(EDITOR_ROLES), workflowController.toggleStatus);
workflowRouter.post("/:id/duplicate", checkRole(EDITOR_ROLES), workflowController.duplicateWorkflow);
workflowRouter.delete("/:id", checkRole(EDITOR_ROLES), workflowController.deleteWorkflow);

// ─── Step Management ──────────────────────────────────────
workflowRouter.post("/:id/steps", checkRole(EDITOR_ROLES), validate(addStepSchema), workflowController.addStep);
workflowRouter.delete("/:id/steps/:stepId", checkRole(EDITOR_ROLES), workflowController.deleteStep);

export default workflowRouter;
