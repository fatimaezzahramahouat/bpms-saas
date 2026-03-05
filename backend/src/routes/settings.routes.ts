import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/requireAdmin.middleware";

const settingsRouter = Router();

// All routes require authentication
settingsRouter.use(authMiddleware);

// ─── User Settings (all authenticated users) ──────────────

// PATCH /api/settings/profile
settingsRouter.patch("/profile", settingsController.updateProfile);

// PATCH /api/settings/password
settingsRouter.patch("/password", settingsController.changePassword);

// PATCH /api/settings/notifications
settingsRouter.patch("/notifications", settingsController.updateNotifications);

// PATCH /api/settings/theme
settingsRouter.patch("/theme", settingsController.updateTheme);

// GET /api/settings/sessions
settingsRouter.get("/sessions", settingsController.getSessions);

// DELETE /api/settings/sessions/:id
settingsRouter.delete("/sessions/:id", settingsController.revokeSession);

// ─── Admin Only Settings ───────────────────────────────────

// PATCH /api/settings/organisation
settingsRouter.patch("/organisation", requireAdmin, settingsController.updateOrganisation);

// DELETE /api/settings/organisation
settingsRouter.delete("/organisation", requireAdmin, settingsController.deleteOrganisation);

// ─── Leave Organisation (any user) ─────────────────────────

// POST /api/settings/leave
settingsRouter.post("/leave", settingsController.leaveOrganisation);

export default settingsRouter;
