import { Request, Response } from "express";
import { z } from "zod";
import { userManagementService } from "../services/userManagement.service";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";

const createUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["RH", "Manager", "Employee"]),
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
});

export const userManagementController = {
    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const organisationId = authReq.user?.organisationId;
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

    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const organisationId = authReq.user?.organisationId;
            const userId = authReq.user?.userId;

            if (!organisationId || !userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Real-time Admin check (Heritage Pattern)
            const admin = await prisma.admin.findUnique({ where: { userId } });
            if (!admin) {
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

    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const id = req.params.id as string;
            const organisationId = authReq.user?.organisationId;
            const userId = authReq.user?.userId;

            if (!organisationId || !userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Real-time Admin check (Heritage Pattern)
            const admin = await prisma.admin.findUnique({ where: { userId } });
            if (!admin) {
                res.status(403).json({ error: "Forbidden: Admin access required" });
                return;
            }

            const parsed = updateUserSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
                return;
            }

            const updateData = Object.fromEntries(
                Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
            ) as { firstName?: string; lastName?: string; email?: string; phone?: string; password?: string };

            const updatedUser = await userManagementService.updateUser(id, updateData, organisationId);

            res.status(200).json({
                message: "User updated successfully",
                data: updatedUser,
            });
        } catch (error: any) {
            if (error.message === "User not found or access denied") {
                res.status(404).json({ error: error.message });
                return;
            }
            if (error.message === "Email already exists") {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const id = req.params.id as string;
            const organisationId = authReq.user?.organisationId;
            const userId = authReq.user?.userId;

            if (!organisationId || !userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Real-time Admin check (Heritage Pattern)
            const admin = await prisma.admin.findUnique({ where: { userId } });
            if (!admin) {
                res.status(403).json({ error: "Forbidden: Admin access required" });
                return;
            }

            await userManagementService.deleteUser(id, organisationId);

            res.status(200).json({
                message: "User deleted successfully",
            });
        } catch (error: any) {
            if (error.message === "User not found or access denied") {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async bulkImport(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const organisationId = authReq.user?.organisationId;
            const userId = authReq.user?.userId;

            if (!organisationId || !userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Real-time Admin check
            const admin = await prisma.admin.findUnique({ where: { userId } });
            if (!admin) {
                res.status(403).json({ error: "Forbidden: Admin access required" });
                return;
            }

            const { users } = req.body;
            if (!users || !Array.isArray(users)) {
                res.status(400).json({ error: "Invalid data format: 'users' array expected" });
                return;
            }

            const result = await userManagementService.bulkImport(users, organisationId);

            res.status(201).json({
                message: `${result.length} utilisateurs ont été importés avec succès.`,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    },
};
