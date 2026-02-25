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
};
