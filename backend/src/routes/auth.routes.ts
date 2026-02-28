import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

// POST /api/auth/register-organisation
authRouter.post("/register-organisation", authController.registerOrganisation);

// POST /api/auth/complete-organisation-info (requires JWT)
authRouter.post("/complete-organisation-info", authMiddleware, authController.completeOrganisationInfo);

// POST /api/auth/login
authRouter.post("/login", authController.login);

// POST /api/auth/logout
authRouter.post("/logout", authController.logout);

// GET /api/auth/me (requires JWT)
authRouter.get("/me", authMiddleware, authController.getCurrentUser);

// PUBLIC: Forgot and Reset Password
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);

export default authRouter;
