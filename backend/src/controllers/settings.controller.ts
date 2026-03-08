import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { settingsService } from "../services/settings.service";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationsSchema,
  updateThemeSchema,
  updateOrganisationSchema,
} from "../schemas/settings.schema";

export const settingsController = {
  // ─── Profile ─────────────────────────────────────────────

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const updateData: Record<string, string> = {};
      if (parsed.data.firstName !== undefined) updateData["firstName"] = parsed.data.firstName;
      if (parsed.data.lastName !== undefined) updateData["lastName"] = parsed.data.lastName;
      if (parsed.data.email !== undefined) updateData["email"] = parsed.data.email;
      if (parsed.data.phone !== undefined) updateData["phone"] = parsed.data.phone;

      const user = await settingsService.updateProfile(userId, updateData);
      res.status(200).json({ message: "Profile updated successfully", data: user });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  // ─── Password ────────────────────────────────────────────

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await settingsService.changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  // ─── Notifications ───────────────────────────────────────

  async updateNotifications(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const parsed = updateNotificationsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const updateData: Record<string, boolean> = {};
      if (parsed.data.emailNotifications !== undefined) updateData["emailNotifications"] = parsed.data.emailNotifications;
      if (parsed.data.inAppNotifications !== undefined) updateData["inAppNotifications"] = parsed.data.inAppNotifications;

      const result = await settingsService.updateNotifications(userId, updateData);
      res.status(200).json({ message: "Notification preferences updated", data: result });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  // ─── Theme ───────────────────────────────────────────────

  async updateTheme(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const parsed = updateThemeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const result = await settingsService.updateTheme(userId, parsed.data.theme);
      res.status(200).json({ message: "Theme updated successfully", data: result });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  // ─── Sessions ────────────────────────────────────────────

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sessions = await settingsService.getSessions(userId);
      res.status(200).json({ data: sessions });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sessionId = req.params.id as string;
      await settingsService.revokeSession(userId, sessionId);
      res.status(200).json({ message: "Session revoked successfully" });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  // ─── Organisation (Admin only) ───────────────────────────

  async updateOrganisation(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const parsed = updateOrganisationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const organisationId = authReq.user?.organisationId;
      if (!organisationId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const updateData: Record<string, string> = {};
      if (parsed.data.logo !== undefined) updateData["logo"] = parsed.data.logo;
      if (parsed.data.domaine !== undefined) updateData["domaine"] = parsed.data.domaine;
      if (parsed.data.address !== undefined) updateData["address"] = parsed.data.address;
      if (parsed.data.city !== undefined) updateData["city"] = parsed.data.city;
      if (parsed.data.website !== undefined) updateData["website"] = parsed.data.website;
      if (parsed.data.emailorg !== undefined) updateData["emailorg"] = parsed.data.emailorg;
      if (parsed.data.phoneorg !== undefined) updateData["phoneorg"] = parsed.data.phoneorg;

      const result = await settingsService.updateOrganisation(organisationId, updateData);
      res.status(200).json({ message: "Organisation updated successfully", data: result });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  async deleteOrganisation(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const organisationId = authReq.user?.organisationId;
      if (!organisationId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await settingsService.deleteOrganisation(organisationId);
      res.clearCookie("token");
      res.status(200).json({ message: "Organisation deleted successfully" });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },

  // ─── Leave Organisation ──────────────────────────────────

  async leaveOrganisation(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId;
      const isAdmin = authReq.user?.isAdmin || false;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await settingsService.leaveOrganisation(userId, isAdmin);
      res.clearCookie("token");
      res.status(200).json({ message: "You have left the organisation" });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message || "Internal server error" });
    }
  },
};
