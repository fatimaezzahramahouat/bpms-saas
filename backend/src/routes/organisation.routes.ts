import { Router } from "express";
import { organisationController } from "../controllers/organisation.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const organisationRouter = Router();

// POST /api/organisation/onboarding
organisationRouter.post("/onboarding", authMiddleware, organisationController.onboarding);

// GET /api/organisation/profile
organisationRouter.get("/profile", authMiddleware, organisationController.profile);

export default organisationRouter;
