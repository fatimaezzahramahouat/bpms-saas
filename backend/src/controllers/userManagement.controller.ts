import { Request, Response } from "express";
import { z } from "zod";
import { userManagementService } from "../services/userManagement.service";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

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
    getUsers: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = authReq.user?.organisationId;
        if (!organisationId) {
            throw new AppError("Unauthorized", 401);
        }

        const users = await userManagementService.listUsers(organisationId);
        res.status(200).json({ data: users });
    }),

    createUser: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = authReq.user?.organisationId;
        const id = authReq.user?.id;

        if (!organisationId || !id) {
            throw new AppError("Unauthorized", 401);
        }

        // Real-time access check (Heritage Pattern)
        const [admin, rh] = await Promise.all([
            prisma.admin.findUnique({ where: { userId: id } }),
            prisma.rH.findUnique({ where: { userId: id } })
        ]);

        if (!admin && !rh) {
            throw new AppError("Forbidden: Admin or RH access required", 403);
        }

        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }

        try {
            const newUser = await userManagementService.createUser(parsed.data, organisationId);
            res.status(201).json({
                message: "User created successfully",
                data: newUser,
            });
        } catch (error: any) {
            if (error.message === "Email already exists") {
                throw new AppError(error.message, 409);
            }
            throw error;
        }
    }),

    updateUser: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = req.params.id as string;
        const organisationId = authReq.user?.organisationId;
        const currentUserId = authReq.user?.id;

        if (!organisationId || !currentUserId) {
            throw new AppError("Unauthorized", 401);
        }

        // Real-time access check (Heritage Pattern)
        const [admin, rh] = await Promise.all([
            prisma.admin.findUnique({ where: { userId: currentUserId } }),
            prisma.rH.findUnique({ where: { userId: currentUserId } })
        ]);

        if (!admin && !rh) {
            throw new AppError("Forbidden: Admin or RH access required", 403);
        }

        const parsed = updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }

        const updateData = Object.fromEntries(
            Object.entries(parsed.data).filter(([_, v]) => v !== undefined)
        ) as { firstName?: string; lastName?: string; email?: string; phone?: string; password?: string };

        try {
            const updatedUser = await userManagementService.updateUser(id, updateData, organisationId);
            res.status(200).json({
                message: "User updated successfully",
                data: updatedUser,
            });
        } catch (error: any) {
            if (error.message === "User not found or access denied") {
                throw new AppError(error.message, 404);
            }
            if (error.message === "Email already exists") {
                throw new AppError(error.message, 409);
            }
            throw error;
        }
    }),

    deleteUser: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const id = req.params.id as string;
        const organisationId = authReq.user?.organisationId;
        const currentUserId = authReq.user?.id;

        if (!organisationId || !currentUserId) {
            throw new AppError("Unauthorized", 401);
        }

        // Real-time access check (Heritage Pattern)
        const [admin, rh] = await Promise.all([
            prisma.admin.findUnique({ where: { userId: currentUserId } }),
            prisma.rH.findUnique({ where: { userId: currentUserId } })
        ]);

        if (!admin && !rh) {
            throw new AppError("Forbidden: Admin or RH access required", 403);
        }

        try {
            await userManagementService.deleteUser(id, organisationId);
            res.status(200).json({
                message: "User deleted successfully",
            });
        } catch (error: any) {
            if (error.message === "User not found or access denied") {
                throw new AppError(error.message, 404);
            }
            throw error;
        }
    }),

    bulkImport: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = authReq.user?.organisationId;
        const currentUserId = authReq.user?.id;

        if (!organisationId || !currentUserId) {
            throw new AppError("Unauthorized", 401);
        }

        // Real-time access check
        const [admin, rh] = await Promise.all([
            prisma.admin.findUnique({ where: { userId: currentUserId } }),
            prisma.rH.findUnique({ where: { userId: currentUserId } })
        ]);

        if (!admin && !rh) {
            throw new AppError("Forbidden: Admin or RH access required", 403);
        }

        const { users } = req.body;
        if (!users || !Array.isArray(users)) {
            throw new AppError("Invalid data format: 'users' array expected", 400);
        }

        const result = await userManagementService.bulkImport(users, organisationId);

        res.status(201).json({
            message: `${result.length} utilisateurs ont été importés avec succès.`,
            data: result,
        });
    }),
};
