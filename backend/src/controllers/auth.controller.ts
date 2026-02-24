import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";

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

      res.status(201).json({
        message: "Organisation registered successfully",
        data: result,
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

      const result = await authService.login(parsed.data);

      res.status(200).json({
        message: "Login successful",
        data: result,
      });
    } catch (error: any) {
      if (error.message === "Invalid email or password") {
        res.status(401).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
