import { Router } from "express";
import { organisationController } from "../controllers/organisation.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadLogo } from "../middleware/upload.middleware";

const organisationRouter = Router();

// POST /api/organisation/onboarding
organisationRouter.post("/onboarding", authMiddleware, uploadLogo.single("logo"), organisationController.onboarding);

// GET /api/organisation/profile
organisationRouter.get("/profile", authMiddleware, organisationController.profile);

// GET /api/organisation/logo
organisationRouter.get("/logo", authMiddleware, organisationController.getLogo);

// GET /api/organisation/members
organisationRouter.get("/members", authMiddleware, organisationController.getMembers);

export default organisationRouter;
