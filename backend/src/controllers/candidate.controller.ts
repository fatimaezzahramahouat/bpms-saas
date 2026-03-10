import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { candidateService } from "../services/candidate.service";
import { z } from "zod";

const createCandidateSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(3, "Full name must be at least 3 characters long"),
  phone: z.string().optional(),
});

export const candidateController = {
  /**
   * POST /api/candidates
   */
  createCandidate: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    // 1. Validate body
    const parsed = createCandidateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // 2. Call service with possible file
    const candidate = await candidateService.registerCandidate({
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(req.file && { cvFile: req.file }),
    });

    res.status(201).json({
      message: "Candidate registered successfully",
      data: candidate,
    });
  }),

  /**
   * GET /api/candidates
   */
  getAllCandidates: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { page, limit, search } = req.query;
    
    const result = await candidateService.getAllCandidates({
      ...(page !== undefined && { page: Number(page) }),
      ...(limit !== undefined && { limit: Number(limit) }),
      ...(typeof search === 'string' && { search }),
    });

    res.status(200).json(result);
  }),

  /**
   * GET /api/candidates/:id
   */
  getCandidateById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    if (typeof id !== 'string') throw new Error("Invalid ID type");
    const candidate = await candidateService.getCandidateById(id);
    res.status(200).json(candidate);
  }),

  /**
   * PUT /api/candidates/:id
   */
  updateCandidate: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    if (typeof id !== 'string') throw new Error("Invalid ID type");
    
    // Partial validation for update
    const updateSchema = createCandidateSchema.partial();
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const candidate = await candidateService.updateCandidate(id, {
      ...(parsed.data.email !== undefined && { email: parsed.data.email }),
      ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(req.file && { cvFile: req.file }),
    });

    res.status(200).json({
      message: "Candidate updated successfully",
      data: candidate,
    });
  }),

  /**
   * DELETE /api/candidates/:id
   */
  deleteCandidate: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    if (typeof id !== 'string') throw new Error("Invalid ID type");
    await candidateService.deleteCandidate(id);
    res.status(204).send();
  }),
};
