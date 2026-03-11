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

  /**
   * PATCH /api/candidates/:id/status
   */
  updateCandidateStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 [Status Update] Attempting to update status');
    console.log('🔄 [Status Update] Candidate ID:', id);
    console.log('🔄 [Status Update] New status:', status);

    if (typeof id !== 'string') {
      console.error('❌ [Status Update] Invalid ID type');
      throw new Error("Invalid ID type");
    }

    // Validate status
    const validStatuses = ['CANDIDATE', 'CONTACTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      console.error('❌ [Status Update] Invalid status:', status);
      res.status(400).json({ 
        error: 'Invalid status. Must be one of: CANDIDATE, CONTACTED, INTERVIEW, ACCEPTED, REJECTED',
        received: status
      });
      return;
    }

    // Check if candidate exists first
    const existingCandidate = await candidateService.getCandidateById(id);
    if (!existingCandidate) {
      console.error('❌ [Status Update] Candidate not found:', id);
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    console.log('📝 [Status Update] Current status:', existingCandidate.status);

    // UPDATE THE DATABASE
    const candidate = await candidateService.updateCandidate(id, {
      status: status as any,
    });

    console.log('✅ [Status Update] Successfully updated to:', candidate.status);

    // Verify the update
    const verification = await candidateService.getCandidateById(id);
    console.log('🔍 [Status Update] Verification - Current status in DB:', verification.status);

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
