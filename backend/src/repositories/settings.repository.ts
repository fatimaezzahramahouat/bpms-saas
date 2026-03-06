import prisma from "../lib/prisma";

export const settingsRepository = {
  // ─── User Queries ────────────────────────────────────────

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        admin: true,
        rh: true,
        manager: true,
        employee: true,
      },
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async getUserPassword(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });
  },

  async updateUserProfile(id: string, data: Partial<{ firstName: string; lastName: string; email: string; phone: string }>) {
    const updateData: Record<string, string> = {};
    if (data.firstName !== undefined) updateData["firstName"] = data.firstName;
    if (data.lastName !== undefined) updateData["lastName"] = data.lastName;
    if (data.email !== undefined) updateData["email"] = data.email;
    if (data.phone !== undefined) updateData["phone"] = data.phone;

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  },

  async updateUserPassword(id: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  },

  async updateUserNotifications(id: string, data: Partial<{ emailNotifications: boolean; inAppNotifications: boolean }>) {
    const updateData: Record<string, boolean> = {};
    if (data.emailNotifications !== undefined) updateData["emailNotifications"] = data.emailNotifications;
    if (data.inAppNotifications !== undefined) updateData["inAppNotifications"] = data.inAppNotifications;

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  },

  async updateUserTheme(id: string, theme: string) {
    return prisma.user.update({
      where: { id },
      data: { theme },
    });
  },

  // ─── Session Queries ─────────────────────────────────────

  async findSessionsByUserId(userId: string) {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findSessionById(id: string) {
    return prisma.session.findUnique({
      where: { id },
    });
  },

  async deleteSession(id: string) {
    return prisma.session.delete({
      where: { id },
    });
  },

  // ─── Organisation Queries ────────────────────────────────

  async findOrgInfo(organisationId: string) {
    return prisma.orgInfo.findUnique({
      where: { organisationId },
    });
  },

  async upsertOrgInfo(
    organisationId: string,
    data: Partial<{ logo: string; domaine: string; address: string; city: string; website: string }>
  ) {
    const updateData: Record<string, string> = {};
    if (data.logo !== undefined) updateData["logo"] = data.logo;
    if (data.domaine !== undefined) updateData["domaine"] = data.domaine;
    if (data.address !== undefined) updateData["address"] = data.address;
    if (data.city !== undefined) updateData["city"] = data.city;
    if (data.website !== undefined) updateData["website"] = data.website;

    return prisma.orgInfo.upsert({
      where: { organisationId },
      update: updateData,
      create: {
        ...updateData,
        organisationId,
      },
    });
  },

  async deleteOrganisation(organisationId: string) {
    return prisma.$transaction(async (tx) => {
      // Delete OrgInfo
      await tx.orgInfo.deleteMany({ where: { organisationId } });

      // Find all users in the org
      const users = await tx.user.findMany({
        where: { organisationId },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        // Delete sessions and notifications for org users
        await tx.session.deleteMany({ where: { userId: { in: userIds } } });
        await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
      }

      // Delete job offers for the org
      await tx.jobOffer.deleteMany({ where: { organisationId } });

      // Delete workflows for the org
      await tx.workflow.deleteMany({ where: { organisationId } });

      // Delete tasks for the org
      await tx.task.deleteMany({ where: { organisationId } });

      // Delete documents for the org
      await tx.document.deleteMany({ where: { organisationId } });

      // Delete role records for all users
      if (userIds.length > 0) {
        await tx.admin.deleteMany({ where: { userId: { in: userIds } } });
        await tx.rH.deleteMany({ where: { userId: { in: userIds } } });
        await tx.manager.deleteMany({ where: { userId: { in: userIds } } });
        await tx.employee.deleteMany({ where: { userId: { in: userIds } } });
      }

      // Delete all users in the org
      await tx.user.deleteMany({ where: { organisationId } });

      // Delete the organisation itself
      await tx.organisation.delete({ where: { id: organisationId } });
    });
  },

  async removeUserFromOrg(userId: string) {
    return prisma.$transaction(async (tx) => {
      // Delete role records
      await tx.admin.deleteMany({ where: { userId } });
      await tx.rH.deleteMany({ where: { userId } });
      await tx.manager.deleteMany({ where: { userId } });
      await tx.employee.deleteMany({ where: { userId } });

      // Delete sessions
      await tx.session.deleteMany({ where: { userId } });

      // Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // Delete the user
      await tx.user.delete({ where: { id: userId } });
    });
  },
};
