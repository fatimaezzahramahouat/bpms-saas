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

    async bulkImport(users: any[], organisationId: string) {
        const defaultPassword = "NexFlow@2025";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const usersToCreate = [];
        const existingEmails = new Set();

        // Check for duplicates in the input list
        const uniqueUsers = users.filter(user => {
            if (existingEmails.has(user.email)) return false;
            existingEmails.add(user.email);
            return true;
        });

        for (const userData of uniqueUsers) {
            const existingUser = await userManagementRepository.findUserByEmail(userData.email);
            if (!existingUser) {
                usersToCreate.push({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    role: userData.role,
                    password: hashedPassword,
                    organisationId,
                });
            }
        }

        if (usersToCreate.length === 0) {
            throw new Error("No new users to import (all exist or invalid data)");
        }

        return userManagementRepository.bulkCreateUsers(usersToCreate);
    },
};
