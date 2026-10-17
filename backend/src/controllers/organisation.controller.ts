import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { authRepository } from "../repositories/auth.repository";
import { storageService } from "../services/storage.service";
import { userManagementService } from "../services/userManagement.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

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
    onboarding: catchAsync(async (req: Request, res: Response) => {
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

        const id = authReq.user?.id;
        const organisationId = authReq.user?.organisationId; // Might be null for Google users
        const userEmail = authReq.user?.email;

        if (!id || !userEmail) {
            throw new AppError("Unauthorized", 401);
        }

        // Fetch user by email to check provider and current state
        const userDb = await authRepository.findUserByEmail(userEmail);

        if (!userDb) {
            throw new AppError("User not found", 404);
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
            try {
                const uploadFolderId = organisationId || id;
                logoUrl = await storageService.uploadLogo(req.file, uploadFolderId);
                console.log('Logo uploaded successfully, URL:', logoUrl);
            } catch (uploadErr: any) {
                console.error('❌ Logo upload failed:', uploadErr?.message || uploadErr);
                // Don't block onboarding if logo upload fails — proceed without logo
                logoUrl = "";
            }
        } else {
            console.log('No file detected in request');
        }

        const result = await authService.completeOnboarding({
            organisationId: organisationId as string | null,
            userId: id,
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
    }),

    profile: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = authReq.user?.organisationId;
        if (!organisationId) {
            throw new AppError("Unauthorized", 401);
        }

        const profile = await authService.getOrganisationProfile(organisationId);
        if (!profile) {
            throw new AppError("Organisation not found", 404);
        }

        res.status(200).json({ data: profile });
    }),

    getLogo: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = authReq.user?.organisationId;
        if (!organisationId) {
            throw new AppError("Unauthorized", 401);
        }

        const logoData = await authService.getOrganisationLogo(organisationId);
        res.status(200).json({ logo: logoData });
    }),

    getMembers: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = authReq.user?.organisationId;
        if (!organisationId) {
            throw new AppError("Unauthorized", 401);
        }

        const users = await userManagementService.listUsers(organisationId);
        res.status(200).json({ data: users });
    }),
};
