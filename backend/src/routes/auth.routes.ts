import { Router } from "express";
import passport from "passport";
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

/**
 * GOOGLE OAUTH ROUTES
 */
// 1. Initiate Google Auth
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 2. Google OAuth Callback
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=auth_failed" }),
  authController.googleAuthCallback
);

// GET /api/auth/me (requires JWT)
authRouter.get("/me", authMiddleware, authController.getCurrentUser);

// PUBLIC: Forgot and Reset Password
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);

export default authRouter;
