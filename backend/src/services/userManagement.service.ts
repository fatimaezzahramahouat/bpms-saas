import bcrypt from "bcrypt";
import { userManagementRepository, CreateUserData } from "../repositories/userManagement.repository";

export const userManagementService = {
    async listUsers(organisationId: string) {
        return userManagementRepository.getUsersByOrganisation(organisationId);
    },

    async createUser(data: CreateUserData, organisationId: string) {
        // 1. Check if user already exists
        const existingUser = await userManagementRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new Error("Email already exists");
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 3. Create user via repository
        return userManagementRepository.createUser(
            {
                ...data,
                password: hashedPassword,
            },
            organisationId
        );
    },

    async updateUser(userId: string, data: { firstName?: string; lastName?: string; email?: string; password?: string }, organisationId: string) {
        const user = await userManagementRepository.findUserById(userId);
        if (!user || user.organisationId !== organisationId) {
            throw new Error("User not found or access denied");
        }

        // If email is changing, check if new email exists
        if (data.email && data.email !== user.email) {
            const existingUser = await userManagementRepository.findUserByEmail(data.email);
            if (existingUser) {
                throw new Error("Email already exists");
            }
        }

        // Hash password if provided
        const finalData = { ...data };
        if (finalData.password) {
            finalData.password = await bcrypt.hash(finalData.password, 10);
        }

        return userManagementRepository.updateUser(userId, finalData);
    },

    async deleteUser(userId: string, organisationId: string) {
        const user = await userManagementRepository.findUserById(userId);
        if (!user || user.organisationId !== organisationId) {
            throw new Error("User not found or access denied");
        }

        return userManagementRepository.deleteUser(userId);
    },
};
