import { Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";

const onboardingSchema = z.object({
    logo: z.string().optional().default(""),
    website: z.string().min(1, "Website is required"),
    city: z.string().min(1, "City is required"),
    domaine: z.string().min(1, "Domaine is required"),
    address: z.string().min(1, "Address is required"),
});

export const organisationController = {
    async onboarding(req: AuthRequest, res: Response): Promise<void> {
        try {
            const parsed = onboardingSchema.safeParse(req.body);
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
                message: "Onboarding completed successfully",
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

    async profile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organisationId = req.user?.organisationId;
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
};
