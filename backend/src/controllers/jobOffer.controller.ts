import { Request, Response } from "express";
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
   * Public: search job offers with pagination and filters.
   */
  getPublicOffers: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const parsed = jobOfferQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await jobOfferService.getPublicOffers(parsed.data);
    res.status(200).json(result);
  }),

  /**
   * GET /api/joboffers/rh
   * RH: fetch this organisation's job offers with status filter support.
   */
  getRHOffers: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const organisationId = authReq.user?.organisationId;
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
   * [RH - MANUAL] Create a new job offer.
   * Always starts as DRAFT with statusSource = MANUAL.
   */
  createOffer: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { organisationId, userId } = authReq.user!;

    const parsed = createJobOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const offer = await jobOfferService.createOffer(organisationId, userId, parsed.data);
    res.status(201).json({
      message: "Job offer created (DRAFT)",
      data: offer,
    });
  }),

  /**
   * PUT /api/joboffers/rh/:id
   * [RH - MANUAL] Update a job offer's fields or status.
   * Allowed statuses: DRAFT, PUBLISHED, PAUSED, CANCELLED.
   * statusSource is automatically set to MANUAL.
   * FILLED and CLOSED are FORBIDDEN here — they are system-only.
   */
  updateOffer: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { organisationId } = authReq.user!;
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
   * [RH - MANUAL] Delete a job offer.
   * ❌ Forbidden if statusSource = AUTOMATIC (i.e., FILLED or CLOSED by system).
   * ✅ Allowed only if statusSource = MANUAL.
   */
  deleteOffer: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { organisationId } = authReq.user!;
    const { id } = req.params;

    const result = await jobOfferService.deleteOffer(id as string, organisationId);

    if (result.reason === "not_found") {
      res.status(404).json({ error: "Job offer not found or unauthorized" });
      return;
    }

    if (result.reason === "forbidden") {
      res.status(403).json({
        error:
          "This job offer was automatically closed or filled by the system and cannot be deleted. Archive it instead.",
      });
      return;
    }

    res.status(204).send();
  }),

  /**
   * GET /api/joboffers/:id
   * Public: get a single job offer by ID.
   */
  getOfferById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const offer = await jobOfferService.getOfferById(id as string);
    if (!offer) {
      res.status(404).json({ error: "Job offer not found" });
      return;
    }
    res.status(200).json({ data: offer });
  }),

  /**
   * GET /api/joboffers/rh/:id/candidates
   * RH: get all candidates for a specific job offer.
   */
  getCandidates: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { organisationId } = authReq.user!;
    const { id } = req.params;

    const candidates = await jobOfferService.getCandidates(id as string, organisationId);
    res.status(200).json({ data: candidates });
  }),

  // ---- SYSTEM AUTOMATION (internal use / webhook / cron) ----

  /**
   * PATCH /api/joboffers/system/:id/fill
   * [SYSTEM - AUTOMATIC] Mark a job offer as FILLED.
   * Triggered when a candidate is accepted.
   * statusSource = AUTOMATIC → cannot be deleted by RH.
   */
  markAsFilled: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const offer = await jobOfferService.markAsFilled(id as string);
    res.status(200).json({ message: "Job offer marked as FILLED (automatic)", data: offer });
  }),

  /**
   * PATCH /api/joboffers/system/:id/close
   * [SYSTEM - AUTOMATIC] Mark a job offer as CLOSED.
   * Triggered by deadline expiry or other system condition.
   * statusSource = AUTOMATIC → cannot be deleted by RH.
   */
  markAsClosed: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const offer = await jobOfferService.markAsClosed(id as string);
    res.status(200).json({ message: "Job offer marked as CLOSED (automatic)", data: offer });
  }),
};
