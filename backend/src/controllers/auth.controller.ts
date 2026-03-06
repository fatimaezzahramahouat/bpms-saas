import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { authRepository } from "../repositories/auth.repository";
import { AuthRequest } from "../middleware/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// ─── Zod Schemas ─────────────────────────────────────────

const registerSchema = z.object({
  organisationName: z.string().min(1, "Organisation name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  phone_org: z.string().min(1, "Phone is required"),
  nb_employers: z.enum(["1-10", "11-50", "51-200", "200+"], {
    error: "nb_employers must be '1-10', '11-50', '51-200', or '200+'",
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
  async registerOrganisation(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409).json({ error: "Email already exists" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async completeOrganisationInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const parsed = completeOrgInfoSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const organisationId = req.user?.organisationId;
      if (!organisationId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const orgInfo = await authService.completeOrganisationInfo(organisationId, parsed.data);

      res.status(201).json({
        message: "Organisation info saved successfully",
        data: orgInfo,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409).json({ error: "Organisation info already exists" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
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
      if (!user) {
        console.warn(`Login attempt failed: User not found (${email})`);
        res.status(401).json({ error: "Identifiants invalides" });
        return;
      }

      // 3. Password Validation
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn(`Login attempt failed: Invalid password (${email})`);
        res.status(401).json({ error: "Identifiants invalides" });
        return;
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
          userId: user.id,
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
            role,
            organisation: user.organisation,
            admin: user.admin,
            rh: user.rh,
            manager: user.manager,
            employee: user.employee
          }
        },
      });
    } catch (error: any) {
      console.error("LOGIN_CRITICAL_ERROR:", error);
      res.status(500).json({
        error: "Une erreur interne est survenue lors de la connexion",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  },

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Non autorisé" });
        return;
      }

      const user = await authRepository.findUserByEmail(req.user!.email);

      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
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
    } catch (error) {
      console.error("GET_CURRENT_USER_ERROR:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const result = await authService.forgotPassword(parsed.data.email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const { token, password } = parsed.data;
      const result = await authService.resetPassword(token, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
