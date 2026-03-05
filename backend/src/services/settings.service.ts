import bcrypt from "bcrypt";
import { settingsRepository } from "../repositories/settings.repository";

export const settingsService = {
  // ─── Profile ─────────────────────────────────────────────

  async updateProfile(userId: string, data: Record<string, string>) {
    // If email is being changed, check for uniqueness
    if (data["email"]) {
      const existing = await settingsRepository.findUserByEmail(data["email"]);
      if (existing && existing.id !== userId) {
        throw { status: 409, message: "Email already in use" };
      }
    }

    return settingsRepository.updateUserProfile(userId, data);
  },

  // ─── Password ────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await settingsRepository.getUserPassword(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw { status: 400, message: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return settingsRepository.updateUserPassword(userId, hashedPassword);
  },

  // ─── Notifications ───────────────────────────────────────

  async updateNotifications(userId: string, data: Record<string, boolean>) {
    return settingsRepository.updateUserNotifications(userId, data);
  },

  // ─── Theme ───────────────────────────────────────────────

  async updateTheme(userId: string, theme: string) {
    return settingsRepository.updateUserTheme(userId, theme);
  },

  // ─── Sessions ────────────────────────────────────────────

  async getSessions(userId: string) {
    return settingsRepository.findSessionsByUserId(userId);
  },

  async revokeSession(userId: string, sessionId: string) {
    const session = await settingsRepository.findSessionById(sessionId);
    if (!session) {
      throw { status: 404, message: "Session not found" };
    }

    if (session.userId !== userId) {
      throw { status: 403, message: "You can only revoke your own sessions" };
    }

    return settingsRepository.deleteSession(sessionId);
  },

  // ─── Organisation (Admin only) ───────────────────────────

  async updateOrganisation(organisationId: string, data: Record<string, string>) {
    return settingsRepository.upsertOrgInfo(organisationId, data);
  },

  async deleteOrganisation(organisationId: string) {
    return settingsRepository.deleteOrganisation(organisationId);
  },

  // ─── Leave Organisation ──────────────────────────────────

  async leaveOrganisation(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      throw { status: 400, message: "Admin cannot leave the organisation. Transfer ownership or delete the organisation instead." };
    }

    const user = await settingsRepository.findUserById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    return settingsRepository.removeUserFromOrg(userId);
  },
};
