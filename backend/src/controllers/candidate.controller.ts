import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
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
    const { id } = req.params;
    if (typeof id !== 'string') throw new AppError("Invalid ID type", 400);
    const candidate = await candidateService.getCandidateById(id);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }
    res.status(200).json(candidate);
  }),

  /**
   * PUT /api/candidates/:id
   */
  updateCandidate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== 'string') throw new AppError("Invalid ID type", 400);
    
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

    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    res.status(200).json({
      message: "Candidate updated successfully",
      data: candidate,
    });
  }),

  /**
   * DELETE /api/candidates/:id
   */
  deleteCandidate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== 'string') throw new AppError("Invalid ID type", 400);
    await candidateService.deleteCandidate(id);
    res.status(204).send();
  }),

  /**
   * PATCH /api/candidates/:id/status
   */
  updateCandidateStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof id !== 'string') {
      throw new AppError("Invalid ID type", 400);
    }

    // Validate status
    const validStatuses = ['CANDIDATE', 'CONTACTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError('Invalid status. Must be one of: CANDIDATE, CONTACTED, INTERVIEW, ACCEPTED, REJECTED', 400);
    }

    // Check if candidate exists first
    const existingCandidate = await candidateService.getCandidateById(id);
    if (!existingCandidate) {
      throw new AppError('Candidate not found', 404);
    }

    // UPDATE THE DATABASE
    const candidate = await candidateService.updateCandidate(id, {
      status: status as any,
    });

    if (!candidate) {
      throw new AppError('Candidate status update failed', 400);
    }

    // Map Prisma enum to display format
    const statusDisplayMap: Record<string, string> = {
      'CANDIDATE': 'Nouveau',
      'CONTACTED': 'En cours',
      'INTERVIEW': 'En cours',
      'ACCEPTED': 'Archivé',
      'REJECTED': 'Rejeté'
    };

    res.status(200).json({
      success: true,
      status: statusDisplayMap[candidate.status] || candidate.status,
      previousStatus: statusDisplayMap[existingCandidate.status] || existingCandidate.status
    });
  }),
};
