import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { authRepository } from "../repositories/auth.repository";
import { storageService } from "../services/storage.service";
import { AuthRequest } from "../middleware/auth.middleware";

const onboardingSchema = z.object({
    website: z.string().url("Invalid website URL").or(z.string().min(1, "Website is required")),
    city: z.string().min(1, "City is required"),
    domaine: z.string().min(1, "Domaine is required"),
    address: z.string().min(1, "Address is required"),
    logo: z.string().optional(),
    emailorg: z.string().email("Invalid organization email"),
    phoneorg: z.string().min(1, "Organization phone is required"),
    // Fields for GOOGLE provider
    name: z.string().optional(),
    nb_employers: z.string().optional(),
});

export const organisationController = {
    async onboarding(req: Request, res: Response): Promise<void> {
        console.log(">>> ONBOARDING CONTROLLER START <<<");
        console.log("Request Body:", req.body);
        console.log("Request File:", req.file);
        console.log("Content-Type:", req.headers["content-type"]);
        try {
            const authReq = req as AuthRequest;
            const parsed = onboardingSchema.safeParse(req.body);
            if (!parsed.success) {
                console.log("Validation Errors:", JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
                res.status(400).json({ 
                    error: "Validation failed", 
                    details: parsed.error.flatten().fieldErrors 
                });
                return;
            }

            const userId = authReq.user?.userId;
            const organisationId = authReq.user?.organisationId; // Might be null for Google users
            const userEmail = authReq.user?.email;

            if (!userId || !userEmail) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            // Fetch user by email to check provider and current state
            const userDb = await authRepository.findUserByEmail(userEmail);

            if (!userDb) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            // Conditional validation for GOOGLE provider
            if (userDb.provider === "GOOGLE") {
                if (!parsed.data.name) {
                    res.status(400).json({ errors: { name: ["Organisation name is required for Google users"] } });
                    return;
                }
                if (!parsed.data.nb_employers) {
                    res.status(400).json({ errors: { nb_employers: ["Organisation size is required for Google users"] } });
                    return;
                }
            }

            let logoUrl = parsed.data.logo || "";

            // If a file was uploaded, upload it to Supabase and get the public URL
            if (req.file) {
                console.log('File detected in request:', req.file.originalname);
                // Use a safe ID for folder name if organisationId is missing
                const uploadFolderId = organisationId || userId;
                logoUrl = await storageService.uploadLogo(req.file, uploadFolderId);
                console.log('Logo uploaded successfully, URL:', logoUrl);
            } else {
                console.log('No file detected in request');
            }

            const result = await authService.completeOnboarding({
                organisationId: organisationId as string | null,
                userId,
                email: userEmail,
                orgInfo: {
                    website: parsed.data.website,
                    city: parsed.data.city,
                    domaine: parsed.data.domaine,
                    address: parsed.data.address,
                    emailorg: parsed.data.emailorg,
                    phoneorg: parsed.data.phoneorg,
                    logo: logoUrl
                },
                organisation: userDb.provider === "GOOGLE" ? {
                    name: parsed.data.name!,
                    nb_employers: parsed.data.nb_employers!
                } : undefined
            });

            res.status(201).json({
                message: "Onboarding completed successfully",
                data: result.orgInfo,
            });
        } catch (error: any) {
            console.error('Onboarding Error:', error);
            if (error.code === "P2002") {
                res.status(409).json({ error: "Organisation info already exists" });
                return;
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async profile(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const organisationId = authReq.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const profile = await authService.getOrganisationProfile(organisationId);
            if (!profile) {
                res.status(404).json({ error: "Organisation not found" });
                return;
            }

            res.status(200).json({ data: profile });
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async getLogo(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const organisationId = authReq.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const logoData = await authService.getOrganisationLogo(organisationId);
            res.status(200).json({ logo: logoData });
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    },
};
