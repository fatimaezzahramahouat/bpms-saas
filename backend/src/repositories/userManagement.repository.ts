import prisma from "../lib/prisma";

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'RH' | 'Manager' | 'Employee';
}

export const userManagementRepository = {
    async getUsersByOrganisation(organisationId: string) {
        return prisma.user.findMany({
            where: { organisationId },
            include: {
                admin: true,
                rh: true,
                manager: true,
                employee: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    async createUser(data: CreateUserData, organisationId: string) {
        const { role, ...userData } = data;

        return prisma.user.create({
            data: {
                ...userData,
                organisationId,
                [role.toLowerCase()]: {
                    create: {},
                },
            },
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
        });
    },
};
