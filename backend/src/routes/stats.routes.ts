import { Router } from "express";
import { statsController } from "../controllers/stats.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All stats routes are protected by authMiddleware
router.use(authMiddleware);

/**
 * @route GET /api/stats/workflows
 * @desc Get comprehensive workflow analytics
 */
router.get("/workflows", statsController.getWorkflowStats);

export default router;
