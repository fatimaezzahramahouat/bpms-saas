import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { jobOfferService } from "../services/jobOffer.service";
import {
  createJobOfferSchema,
  updateJobOfferSchema,
  jobOfferQuerySchema,
} from "../schemas/jobOffer.schema";

export const jobOfferController = {
  /**
   * GET /api/joboffers
   * Public search with pagination and filters.
   */
  getPublicOffers: catchAsync(async (req: AuthRequest, res: Response) => {
    const parsed = jobOfferQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // If user is logged in, we COULD filter by their org, 
    // but requirement 1 says "PUBLIC ENDPOINT" and requirement 2 says "RH DASHBOARD".
    // I will keep public endpoint platform-wide search as per standard Job Boards, 
    // unless authenticated RH wants to see platform-wide too.
    const result = await jobOfferService.getPublicOffers(parsed.data);
    res.status(200).json(result);
  }),

  /**
   * GET /api/joboffers/rh
   * RH-specific offers for their organisation.
   */
  getRHOffers: catchAsync(async (req: AuthRequest, res: Response) => {
    const organisationId = req.user?.organisationId;
    if (!organisationId) throw new Error("Missing organisationId");

    const parsed = jobOfferQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const result = await jobOfferService.getRHOffers(organisationId, parsed.data);
    res.status(200).json(result);
  }),

  /**
   * POST /api/joboffers/rh
   */
  createOffer: catchAsync(async (req: AuthRequest, res: Response) => {
    const { organisationId, userId } = req.user!;
    
    const parsed = createJobOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const offer = await jobOfferService.createOffer(organisationId, userId, parsed.data);
    res.status(201).json({ message: "Job offer created", data: offer });
  }),

  /**
   * PUT /api/joboffers/rh/:id
   */
  updateOffer: catchAsync(async (req: AuthRequest, res: Response) => {
    const { organisationId } = req.user!;
    const { id } = req.params;

    const parsed = updateJobOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const offer = await jobOfferService.updateOffer(id as string, organisationId, parsed.data);
    if (!offer) {
      res.status(404).json({ error: "Job offer not found or unauthorized" });
      return;
    }

    res.status(200).json({ message: "Job offer updated", data: offer });
  }),

  /**
   * DELETE /api/joboffers/rh/:id
   */
  deleteOffer: catchAsync(async (req: AuthRequest, res: Response) => {
    const { organisationId } = req.user!;
    const { id } = req.params;

    const deleted = await jobOfferService.deleteOffer(id as string, organisationId);
    if (!deleted) {
      res.status(404).json({ error: "Job offer not found or unauthorized" });
      return;
    }

    res.status(204).send();
  }),

  /**
   * GET /api/joboffers/:id
   */
  getOfferById: catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const offer = await jobOfferService.getOfferById(id as string);
    if (!offer) {
      res.status(404).json({ error: "Job offer not found" });
      return;
    }
    res.status(200).json({ data: offer });
  }),
};
