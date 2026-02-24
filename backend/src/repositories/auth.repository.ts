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
      include: { organisation: true, admin: true },
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
        organisationId,
      },
    });
  },

  async findOrganisationById(id: string) {
    return prisma.organisation.findUnique({
      where: { id },
      include: {
        orgInfo: true
      }
    });
  },
};
