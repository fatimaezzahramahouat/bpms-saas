import { Response } from "express";
import { z } from "zod";
import { userManagementService } from "../services/userManagement.service";
import { AuthRequest } from "../middleware/auth.middleware";

const createUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["RH", "Manager", "Employee"]),
});

export const userManagementController = {
    async getUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organisationId = req.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const users = await userManagementService.listUsers(organisationId);
            res.status(200).json({ data: users });
        } catch (error: any) {
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async createUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organisationId = req.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Check if current user is admin
            if (!req.user?.isAdmin) {
                res.status(403).json({ error: "Forbidden: Admin access required" });
                return;
            }

            const parsed = createUserSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
                return;
            }

            const newUser = await userManagementService.createUser(parsed.data, organisationId);

            res.status(201).json({
                message: "User created successfully",
                data: newUser,
            });
        } catch (error: any) {
            if (error.message === "Email already exists") {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },
};
