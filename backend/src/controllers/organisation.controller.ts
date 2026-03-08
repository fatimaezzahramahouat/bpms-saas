import { Request, Response } from "express";
import { z } from "zod";
import { storageService } from "../services/storage.service";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";

const onboardingSchema = z.object({
    website: z.string().min(1, "Website is required"),
    city: z.string().min(1, "City is required"),
    domaine: z.string().min(1, "Domaine is required"),
    address: z.string().min(1, "Address is required"),
    logo: z.string().optional(),
});

export const organisationController = {
    async onboarding(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthRequest;
            const parsed = onboardingSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
                return;
            }

            const organisationId = authReq.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            let logoUrl = parsed.data.logo || "";

            // If a file was uploaded, upload it to Supabase and get the public URL
            if (req.file) {
                console.log('File detected in request:', req.file.originalname);
                logoUrl = await storageService.uploadLogo(req.file, organisationId);
                console.log('Logo uploaded successfully, URL:', logoUrl);
            } else {
                console.log('No file detected in request');
            }

            const orgInfo = await authService.completeOrganisationInfo(organisationId, {
                ...parsed.data,
                logo: logoUrl
            });

            res.status(201).json({
                message: "Onboarding completed successfully",
                data: orgInfo,
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
