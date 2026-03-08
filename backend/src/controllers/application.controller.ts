import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { applicationService } from "../services/application.service";
import { z } from "zod";

const applySchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export const applicationController = {
  /**
   * POST /api/joboffers/:jobOfferId/apply
   */
  applyToJob: catchAsync(async (req: Request, res: Response) => {
    const { jobOfferId } = req.params;

    // 1. Validate Input
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // 2. Check for CV file
    if (!req.file) {
      res.status(400).json({ error: "CV file is required (PDF format only)" });
      return;
    }

    // 3. Call Service
    const application = await applicationService.applyToJob(
      jobOfferId as string,
      {
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      },
      req.file
    );





// ✅ 4. Trigger AI Analysis in background (non-blocking)


// ✅ 4. Trigger AI Analysis in background (non-blocking)
setImmediate(async () => {
  try {
    console.log('🤖 [AI Debug] Starting background analysis for application:', application.id);
    
    // ✅ Check if file exists inside background task
    if (!req.file?.path) {
      console.warn('⚠️ [AI Debug] No CV file path available for analysis');
      return;
    }

    // ✅ Import helper functions from cvExtractor (which uses require for pdf-parse)
    const { extractTextFromPDFFile, extractCVDataFromText } = await import('../lib/cvExtractor');
    
    // ✅ Extract raw text from PDF using the safe require-based function
    const cvText = await extractTextFromPDFFile(req.file.path);
    console.log('📄 [AI Debug] Extracted CV text length:', cvText.length);

    // ✅ Extract structured data from CV using AI
    const cvData = await extractCVDataFromText(cvText);
    console.log('🧠 [AI Debug] CV data extracted:', {
      skills: cvData.skills.length,
      hasEmail: !!cvData.email,
      hasName: !!cvData.fullName
    });

    // ✅ Get job offer for context (using correct method name)
    const { jobOfferService } = await import('../services/jobOffer.service');
    const jobOffer = await jobOfferService.getOfferById(jobOfferId as string);
    
    if (!jobOffer) {
      console.warn('⚠️ [AI Debug] Job offer not found for ID:', jobOfferId);
      return;
    }

    // ✅ Call AI analysis service (using correct method name)
    const { aiService } = await import('../services/ai.service');
    
    console.log('🔄 [AI Debug] Calling aiService.generateCandidateAnalysis...');
    
    await aiService.generateCandidateAnalysis(application.id);
    
    console.log('✅ [AI Debug] Analysis completed and saved for application:', application.id);
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ [AI Debug] Background analysis FAILED:', {
      applicationId: application?.id,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    // Don't throw - background task failure shouldn't affect user
  }
});
    res.status(201).json({
      message: "Application submitted successfully",
      data: application,
    });
  }),

  /**
   * GET /api/joboffers/:jobOfferId/applications
   */
  getApplicationsByJob: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { jobOfferId } = req.params;
    const { organisationId } = authReq.user!;

    const applications = await applicationService.getJobApplications(
      jobOfferId as string,
      organisationId
    );

    res.status(200).json({
      data: applications
    });
  }),

  /**
   * PATCH /api/applications/:id/status
   */
  updateStatus: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { organisationId } = authReq.user!;

    const statusSchema = z.object({
      status: z.enum(["INTERVIEW", "ACCEPTED", "REJECTED", "CONTACTED"]),
    });

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const application = await applicationService.updateStatus(
      id as string,
      parsed.data.status,
      organisationId
    );

    res.status(200).json({
      message: "Application status updated successfully",
      data: application,
    });
  }),

  /**
   * DELETE /api/applications/:id
   */
  deleteApplication: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { organisationId } = authReq.user!;

    await applicationService.deleteApplication(id as string, organisationId);

    res.status(200).json({
      message: "Application deleted successfully",
    });
  }),
};
