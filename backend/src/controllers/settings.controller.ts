import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { settingsService } from "../services/settings.service";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationsSchema,
  updateThemeSchema,
  updateOrganisationSchema,
} from "../schemas/settings.schema";

export const settingsController = {
  // ─── Profile ─────────────────────────────────────────────

  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    const updateData: Record<string, string> = {};
    if (parsed.data.firstName !== undefined) updateData["firstName"] = parsed.data.firstName;
    if (parsed.data.lastName !== undefined) updateData["lastName"] = parsed.data.lastName;
    if (parsed.data.email !== undefined) updateData["email"] = parsed.data.email;
    if (parsed.data.phone !== undefined) updateData["phone"] = parsed.data.phone;

    try {
      const user = await settingsService.updateProfile(id as string, updateData);
      res.status(200).json({ message: "Profile updated successfully", data: user });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  // ─── Password ────────────────────────────────────────────

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      await settingsService.changePassword(id as string, parsed.data.currentPassword, parsed.data.newPassword);
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  // ─── Notifications ───────────────────────────────────────

  updateNotifications: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = updateNotificationsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    const updateData: Record<string, boolean> = {};
    if (parsed.data.emailNotifications !== undefined) updateData["emailNotifications"] = parsed.data.emailNotifications;
    if (parsed.data.inAppNotifications !== undefined) updateData["inAppNotifications"] = parsed.data.inAppNotifications;

    try {
      const result = await settingsService.updateNotifications(id as string, updateData);
      res.status(200).json({ message: "Notification preferences updated", data: result });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  // ─── Theme ───────────────────────────────────────────────

  updateTheme: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = updateThemeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      const result = await settingsService.updateTheme(id as string, parsed.data.theme);
      res.status(200).json({ message: "Theme updated successfully", data: result });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  // ─── Sessions ────────────────────────────────────────────

  getSessions: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    const sessions = await settingsService.getSessions(id as string);
    res.status(200).json({ data: sessions });
  }),

  revokeSession: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    const sessionId = req.params.id as string;
    try {
      await settingsService.revokeSession(id as string, sessionId);
      res.status(200).json({ message: "Session revoked successfully" });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  // ─── Organisation (Admin only) ───────────────────────────

  updateOrganisation: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = updateOrganisationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const organisationId = authReq.user?.organisationId;
    if (!organisationId) {
      throw new AppError("Unauthorized", 401);
    }

    const updateData: Record<string, string> = {};
    if (parsed.data.logo !== undefined) updateData["logo"] = parsed.data.logo;
    if (parsed.data.domaine !== undefined) updateData["domaine"] = parsed.data.domaine;
    if (parsed.data.address !== undefined) updateData["address"] = parsed.data.address;
    if (parsed.data.city !== undefined) updateData["city"] = parsed.data.city;
    if (parsed.data.website !== undefined) updateData["website"] = parsed.data.website;
    if (parsed.data.emailorg !== undefined) updateData["emailorg"] = parsed.data.emailorg;
    if (parsed.data.phoneorg !== undefined) updateData["phoneorg"] = parsed.data.phoneorg;

    try {
      const result = await settingsService.updateOrganisation(organisationId, updateData);
      res.status(200).json({ message: "Organisation updated successfully", data: result });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  deleteOrganisation: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const organisationId = authReq.user?.organisationId;
    if (!organisationId) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      await settingsService.deleteOrganisation(organisationId);
      res.clearCookie("token");
      res.status(200).json({ message: "Organisation deleted successfully" });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),

  // ─── Leave Organisation ──────────────────────────────────

  leaveOrganisation: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const id = authReq.user?.id;
    const isAdmin = authReq.user?.isAdmin || false;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      await settingsService.leaveOrganisation(id as string, isAdmin);
      res.clearCookie("token");
      res.status(200).json({ message: "You have left the organisation" });
    } catch (error: any) {
      throw new AppError(error.message || "Internal server error", error.status || 500);
    }
  }),
};
