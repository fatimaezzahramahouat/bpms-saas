import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { authRepository } from "../repositories/auth.repository";
import { AuthRequest } from "../middleware/auth.middleware";

import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// ─── Zod Schemas ─────────────────────────────────────────

const registerSchema = z.object({
  organisationName: z.string().min(1, "Organisation name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  phone_org: z.string().min(1, "Phone is required"),
  nb_employers: z.enum(["1-10", "11-50", "51-200", "200+"], {
    error: () => ({ message: "nb_employers must be '1-10', '11-50', '51-200', or '200+'" }),
  }),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const completeOrgInfoSchema = z.object({
  logo: z.string().min(1, "Logo is required"),
  website: z.string().min(1, "Website is required"),
  city: z.string().min(1, "City is required"),
  domaine: z.string().min(1, "Domaine is required"),
  address: z.string().min(1, "Address is required"),
  emailorg: z.string().email("Invalid organization email"),
  phoneorg: z.string().min(1, "Organization phone is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ─── Controllers ─────────────────────────────────────────

export const authController = {
  registerOrganisation: catchAsync(async (req: Request, res: Response) => {
    // Validate request body
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const result = await authService.registerOrganisation(parsed.data);

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(201).json({
      message: "Organisation registered successfully",
      data: { user: result.user },
    });
  }),

  completeOrganisationInfo: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    // Validate request body
    const parsed = completeOrgInfoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const organisationId = authReq.user?.organisationId;
    if (!organisationId) {
      throw new AppError("Unauthorized", 401);
    }

    const orgInfo = await authService.completeOrganisationInfo(organisationId, parsed.data);

    res.status(201).json({
      message: "Organisation info saved successfully",
      data: orgInfo,
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    // Validate request body
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    // 1. Use the repository for a trusted, robust query
    const user = await authRepository.findUserByEmail(email);

    // 2. Safety Checks: If user not found
    if (!user || !user.password) {
      console.warn(`Login attempt failed: Invalid credentials for user (${email})`);
      throw new AppError("Identifiants invalides", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login attempt failed: Invalid password (${email})`);
      throw new AppError("Identifiants invalides", 401);
    }

    // 4. Role Identification (Heritage Pattern safety)
    let role = "EMPLOYEE";
    if (user.admin) role = "ADMIN";
    else if (user.rh) role = "RH";
    else if (user.manager) role = "MANAGER";
    else if (user.employee) role = "EMPLOYEE";

    // 5. JWT Payload - RESTORE isAdmin for middleware compatibility
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: role,
        organisationId: user.organisationId,
        firstName: user.firstName,
        isAdmin: !!user.admin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
   
    // 5. Create Session record
    await authRepository.createSession(
      user.id,
      req.headers["user-agent"] as string,
      req.ip
    );
   
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({
      message: "Login successful",
      token,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: role as string,
          organisation: user.organisation,
          admin: user.admin,
          rh: user.rh,
          manager: user.manager,
          employee: user.employee
        }
      },
    });
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  }),

  getCurrentUser: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const id = authReq.user?.id;
    if (!id) {
      throw new AppError("Non autorisé", 401);
    }

    const user = await authRepository.findUserByEmail(authReq.user!.email);

    if (!user) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    // Role Identification (consistent with login logic)
    let role = "EMPLOYEE";
    if (user.admin) role = "ADMIN";
    else if (user.rh) role = "RH";
    else if (user.manager) role = "MANAGER";
    else if (user.employee) role = "EMPLOYEE";

    res.status(200).json({
      data: {
        ...user,
        role
      }
    });
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const result = await authService.forgotPassword(parsed.data.email);
    res.status(200).json(result);
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { token, password } = parsed.data;
    const result = await authService.resetPassword(token, password);
    res.status(200).json(result);
  }),

  googleAuthCallback: catchAsync(async (req: any, res: Response) => {
    const user = req.user as any;
    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`);
      return;
    }

    // Role Identification (Heritage Pattern safety)
    let role = "EMPLOYEE";
    if (user.admin) role = "ADMIN";
    else if (user.rh) role = "RH";
    else if (user.manager) role = "MANAGER";
    else if (user.employee) role = "EMPLOYEE";

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: role,
        organisationId: user.organisationId,
        firstName: user.firstName,
        isAdmin: role === "ADMIN",
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create Session record
    await authRepository.createSession(
      user.id,
      req.headers["user-agent"] as string,
      req.ip
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Redirect WITHOUT token in URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/dashboard`);
  }),
};
