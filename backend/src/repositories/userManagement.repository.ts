import prisma from "../lib/prisma";

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'RH' | 'Manager' | 'Employee';
}

export const userManagementRepository = {
    async getUsersByOrganisation(organisationId: string) {
        return prisma.user.findMany({
            where: { organisationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                createdAt: true,
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

    async updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; password?: string }) {
        return prisma.user.update({
            where: { id },
            data,
        });
    },

    async deleteUser(id: string) {
        // Since we are using a heritage pattern with separate tables, 
        // we should delete the user which should cascade or we delete related first if not configured in prisma
        // Looking at the schema, it's better to do it in a transaction to be safe
        return prisma.$transaction(async (tx) => {
            // Check for roles and delete them first
            await tx.admin.deleteMany({ where: { userId: id } });
            await tx.rH.deleteMany({ where: { userId: id } });
            await tx.manager.deleteMany({ where: { userId: id } });
            await tx.employee.deleteMany({ where: { userId: id } });

            // Delete the user
            return tx.user.delete({
                where: { id },
            });
        });
    },

    async bulkCreateUsers(usersData: (CreateUserData & { organisationId: string })[]) {
        return prisma.$transaction(async (tx) => {
            const createdUsers = [];
            for (const data of usersData) {
                const { role, ...userData } = data;
                const user = await tx.user.create({
                    data: {
                        ...userData,
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
                createdUsers.push(user);
            }
            return createdUsers;
        });
    },
};
