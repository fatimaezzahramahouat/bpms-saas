import prisma from "../lib/prisma";

interface RegisterOrgData {
  organisationName: string;
  adminName: string;
  email: string;
  hashedPassword: string;
  phone_org: string;
  nb_employers: number;
  firstName: string;
  lastName: string;
}

interface OrgInfoData {
  logo: string;
  website: string;
  city: string;
  domaine: string;
  address: string;
  emailorg?: string;
  phoneorg?: string;
}

interface OnboardingTransactionData {
  organisationId?: string | null;
  userId: string;
  orgInfo: OrgInfoData;
  organisation?: {
    name: string;
    nb_employers: number;
    email: string; // Added to create organisation
  };
}

export const authRepository = {
  async createOrganisationWithAdmin(data: RegisterOrgData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Organisation
      const organisation = await tx.organisation.create({
        data: {
          name: data.organisationName,
          nom_admin: data.adminName,
          email: data.email,
          password: data.hashedPassword,
          phone_org: data.phone_org,
          nb_employers: data.nb_employers,
        },
      });

      // 2. Create User linked to Organisation
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          organisationId: organisation.id,
        },
      });

      // 3. Create Admin record linked to User
      const admin = await tx.admin.create({
        data: {
          userId: user.id,
        },
      });

      return { organisation, user, admin };
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        organisation: {
          include: {
            orgInfo: {
              select: {
                id: true,
                domaine: true,
                address: true,
                city: true,
                website: true,
                logo: true,
                emailorg: true,
                phoneorg: true
              }
            }
          }
        },
        admin: true,
        rh: true,
        manager: true,
        employee: true
      },
    });
  },

  async createOrgInfo(organisationId: string, data: OrgInfoData) {
    return prisma.orgInfo.create({
      data: {
        logo: data.logo,
        website: data.website,
        city: data.city,
        domaine: data.domaine,
        address: data.address,
        emailorg: data.emailorg,
        phoneorg: data.phoneorg,
        organisationId,
      },
    });
  },

  async completeOnboardingTransaction(data: OnboardingTransactionData) {
    return prisma.$transaction(async (tx) => {
      let finalOrganisationId = data.organisationId;

      // 1. Create or Update Organisation
      if (!finalOrganisationId && data.organisation) {
        // Create new organisation for Google users
        const newOrg = await tx.organisation.create({
          data: {
            name: data.organisation.name,
            nb_employers: data.organisation.nb_employers,
            email: data.organisation.email,
            nom_admin: "", // Can be filled later or left empty
            password: "", // No password for Google orgs
          },
        });
        finalOrganisationId = newOrg.id;
      } else if (finalOrganisationId && data.organisation) {
        // Update existing organisation (if any)
        await tx.organisation.update({
          where: { id: finalOrganisationId },
          data: {
            name: data.organisation.name,
            nb_employers: data.organisation.nb_employers,
          },
        });
      }

      if (!finalOrganisationId) {
        throw new Error("Organisation ID is required but was not provided or created.");
      }

      // 2. Create OrgInfo
      const orgInfo = await tx.orgInfo.create({
        data: {
          logo: data.orgInfo.logo,
          website: data.orgInfo.website,
          city: data.orgInfo.city,
          domaine: data.orgInfo.domaine,
          address: data.orgInfo.address,
          emailorg: data.orgInfo.emailorg,
          phoneorg: data.orgInfo.phoneorg,
          organisationId: finalOrganisationId,
        },
      });

      // 3. Update User: Set profileCompleted and link to organisation if not already linked
      const user = await tx.user.update({
        where: { id: data.userId },
        data: {
          profileCompleted: true,
          organisationId: finalOrganisationId,
        },
      });

      return { orgInfo, user };
    });
  },
  
  async findOrganisationById(id: string) {
    return prisma.organisation.findUnique({
      where: { id },
      include: {
        orgInfo: {
          select: {
            id: true,
            domaine: true,
            address: true,
            city: true,
            website: true,
            logo: true,
            emailorg: true,
            phoneorg: true
          }
        },
        users: {
          include: {
            admin: true,
            rh: true,
            manager: true,
            employee: true
          }
        }
      }
    });
  },

  async getLogo(organisationId: string) {
    return prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        orgInfo: {
          select: {
            logo: true
          }
        }
      }
    });
  },

  async updateUserResetToken(id: string, token: string | null, expires: Date | null) {
    return prisma.user.update({
      where: { id },
      data: {
        resetToken: token,
        resetExpires: expires,
      },
    });
  },

  async findUserByResetToken(token: string) {
    return prisma.user.findUnique({
      where: { resetToken: token },
    });
  },

  async updateUserPassword(id: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    });
  },
  
  async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    return prisma.session.create({
      data: {
        userId,
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
      },
    });
  },
};
