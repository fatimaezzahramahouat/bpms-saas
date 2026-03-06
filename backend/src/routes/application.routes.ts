// /home/manal/projet_final_BPMS/backend/src/routes/application.routes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateContent } from '../lib/groq';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// ============================================================================
// Multer Configuration for CV File Uploads
// ============================================================================
const uploadDir = path.join(__dirname, '../../uploads/cvs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ============================================================================
// ROUTES - ORDER IS CRITICAL: Most specific FIRST, generic LAST
// ============================================================================

// 🔍 1. Test route (للتأكد أن الملف يعمل)
router.get('/test-debug', (req: Request, res: Response) => {
  res.json({ 
    message: '✅ application.routes.ts is loaded!',
    timestamp: new Date().toISOString()
  });
});

// ✅ 2. POST /applications/:jobOfferId/apply - MOST SPECIFIC (يجب أن يأتي قبل /:id)
// Simple test version - no Prisma/AI for now
// ✅ POST /:jobOfferId/apply - FULL VERSION with Prisma + AI
router.post('/:jobOfferId/apply', upload.single('cv'), async (req: Request, res: Response) => {
  try {
    const jobOfferId = req.params.jobOfferId as string;
    const { fullName, email, phone } = req.body;
    const cvFile = req.file;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!cvFile) {
      return res.status(400).json({ error: 'CV file is required' });
    }

    // Create CV URL for local storage
    const cvUrl = `/uploads/cvs/${cvFile.filename}`;

    // Find or create candidate - ✅ CORRECT PRISMA SYNTAX
    let candidate = await prisma.candidate.findUnique({ where: { email } });
    
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {  // ✅ مهم: كلمة "data:"
          fullName: fullName || 'Unknown',
          email,
          phone: phone || null,
          cv: cvUrl,
          status: 'CANDIDATE'
        }
      });
      console.log('✅ Candidate created:', candidate.id, candidate.fullName);
    } else {
      console.log('✅ Candidate found:', candidate.id, candidate.fullName);
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateId_jobOfferId: {
          candidateId: candidate.id,
          jobOfferId: jobOfferId
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        error: 'Candidate already applied to this job offer',
        applicationId: existingApplication.id
      });
    }

    // Get job offer details
    const jobOffer = await prisma.jobOffer.findUnique({ 
      where: { id: jobOfferId as string } 
    });
    
    if (!jobOffer) {
      return res.status(404).json({ error: 'Job offer not found' });
    }

    // Create application - ✅ CORRECT PRISMA SYNTAX
    const application = await prisma.application.create({
      data: {  // ✅ مهم: كلمة "data:"
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: 'APPLIED'
      }
    });

    console.log('✅ Application created:', application.id);

    // ========================================================================
    // AUTOMATIC AI ANALYSIS - Run in background (do not wait for response)
    // ========================================================================
    setImmediate(async () => {
      try {
        console.log('🤖 Starting automatic AI analysis for application:', application.id);
        
        const prompt = `
Analyze the compatibility between this candidate and job offer:

CANDIDATE:
Name: ${candidate.fullName}
Email: ${candidate.email}
CV: ${candidate.cv}

JOB OFFER:
Title: ${jobOffer.title}
Required Skills: ${(jobOffer.skills || []).join(', ')}
Level: ${jobOffer.level}

Provide JSON with: overallScore (0-100), categoryScores (skills/experience/education/technicalFit), matchedRequirements, missingRequirements, strengths, weaknesses, recommendation (decision/priority/interviewQuestions/notes).
Respond in French.
`;

        const analysisText = await generateContent(prompt);
        const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);

        const ensureArray = (value: unknown): string[] => {
          if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
          if (typeof value === 'string') return value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
          return [];
        };

        await prisma.aIAnalysis.create({
          data: {  // ✅ مهم: كلمة "data:"
            type: 'CANDIDATE_ANALYSIS',
            candidateId: candidate.id,
            jobOfferId: jobOffer.id,
            applicationId: application.id,
            overallScore: Number(analysis.overallScore) || 0,
            skillsScore: analysis.categoryScores?.skills ? Number(analysis.categoryScores.skills) : null,
            experienceScore: analysis.categoryScores?.experience ? Number(analysis.categoryScores.experience) : null,
            educationScore: analysis.categoryScores?.education ? Number(analysis.categoryScores.education) : null,
            technicalFitScore: analysis.categoryScores?.technicalFit ? Number(analysis.categoryScores.technicalFit) : null,
            matchedSkills: ensureArray(analysis.matchedRequirements),
            missingSkills: ensureArray(analysis.missingRequirements),
            strengths: ensureArray(analysis.strengths),
            weaknesses: ensureArray(analysis.weaknesses),
            recommendation: analysis.recommendation?.decision || null,
            priority: analysis.recommendation?.priority || null,
            interviewQuestions: ensureArray(analysis.recommendation?.interviewQuestions),
            result: analysis,
            confidence: analysis.overallScore ? Number(analysis.overallScore) / 100 : null
          }
        });

        console.log('💾 Automatic analysis saved for application:', application.id);

      } catch (error) {
        console.error('❌ Automatic AI analysis failed:', error);
      }
    });

    // Return success immediately (do not wait for AI)
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: application.status,
        createdAt: application.createdAt
      },
      note: 'AI analysis is running in the background and will be available shortly'
    });

  } catch (error) {
    console.error('❌ Error creating application:', error);
    res.status(500).json({ 
      error: 'Failed to submit application',
      details: (error as Error).message
    });
  }
});

// ✅ 3. POST /applications - Generic endpoint (fallback)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { candidateId, jobOfferId, fullName, email, phone, cv, skills, experience, education } = req.body;

    if (!jobOfferId || !email) {
      return res.status(400).json({ error: 'jobOfferId and email are required' });
    }

    // Ensure jobOfferId is a string (handle string | string[] | undefined)
    const jobOfferIdStr = Array.isArray(jobOfferId) ? jobOfferId[0] : jobOfferId;

    let candidate;
    
    if (candidateId) {
      candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    }
    
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          fullName: fullName || 'Unknown',
          email,
          phone: phone || null,
          cv: cv || null,
          status: 'CANDIDATE'
        }
      });
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateId_jobOfferId: {
          candidateId: candidate.id,
          jobOfferId: jobOfferIdStr
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        error: 'Candidate already applied to this job offer',
        applicationId: existingApplication.id
      });
    }

    const jobOffer = await prisma.jobOffer.findUnique({ where: { id: jobOfferIdStr } });
    if (!jobOffer) {
      return res.status(404).json({ error: 'Job offer not found' });
    }

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: 'APPLIED'
      }
    });

    console.log('✅ Application created:', application.id);

    // Automatic AI Analysis in background
    setImmediate(async () => {
      try {
        console.log('🤖 Starting automatic AI analysis for application:', application.id);
        
        const cvData = {
          name: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          cvUrl: candidate.cv,
          skills: skills || [],
          experience: experience || '',
          education: education || ''
        };
        
        const jobOfferData = {
          title: jobOffer.title,
          requiredSkills: jobOffer.skills || [],
          requiredLevel: jobOffer.level,
          contractType: jobOffer.contractType,
          workMode: jobOffer.workMode,
          description: jobOffer.description
        };

        const prompt = `
Analyze the compatibility between this candidate and job offer:

CANDIDATE:
Name: ${cvData.name}
Email: ${cvData.email}
Skills: ${cvData.skills?.join(', ') || 'Not specified'}
Experience: ${cvData.experience || 'Not specified'}
Education: ${cvData.education || 'Not specified'}

JOB OFFER:
Title: ${jobOfferData.title}
Required Skills: ${jobOfferData.requiredSkills.join(', ')}
Level: ${jobOfferData.requiredLevel}
Contract: ${jobOfferData.contractType}
Work Mode: ${jobOfferData.workMode}

Provide JSON with: overallScore, categoryScores (skills/experience/education/technicalFit), matchedRequirements, missingRequirements, strengths, weaknesses, recommendation (decision/priority/interviewQuestions/notes).
Respond in French.
`;

        console.log('🔄 Calling Groq AI...');
        const analysisText = await generateContent(prompt);
        console.log('✅ Response received from Groq AI');

        const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanText;
        const analysis = JSON.parse(jsonString);

        console.log('📊 Parsed analysis:', { overallScore: analysis.overallScore });

        const ensureArray = (value: unknown): string[] => {
          if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
          if (typeof value === 'string') return value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
          return [];
        };

        await prisma.aIAnalysis.create({
          data: {
            type: 'CANDIDATE_ANALYSIS',
            candidateId: candidate.id,
            jobOfferId: jobOffer.id,
            applicationId: application.id,
            overallScore: Number(analysis.overallScore) || 0,
            skillsScore: analysis.categoryScores?.skills ? Number(analysis.categoryScores.skills) : null,
            experienceScore: analysis.categoryScores?.experience ? Number(analysis.categoryScores.experience) : null,
            educationScore: analysis.categoryScores?.education ? Number(analysis.categoryScores.education) : null,
            technicalFitScore: analysis.categoryScores?.technicalFit ? Number(analysis.categoryScores.technicalFit) : null,
            matchedSkills: ensureArray(analysis.matchedRequirements),
            missingSkills: ensureArray(analysis.missingRequirements),
            strengths: ensureArray(analysis.strengths),
            weaknesses: ensureArray(analysis.weaknesses),
            recommendation: analysis.recommendation?.decision || null,
            priority: analysis.recommendation?.priority || null,
            interviewQuestions: ensureArray(analysis.recommendation?.interviewQuestions),
            result: analysis,
            confidence: analysis.overallScore ? Number(analysis.overallScore) / 100 : null
          }
        });

        console.log('💾 Automatic analysis saved for application:', application.id);

      } catch (error) {
        console.error('❌ Automatic AI analysis failed:', error);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: application.status,
        createdAt: application.createdAt
      },
      note: 'AI analysis is running in the background'
    });

  } catch (error) {
    console.error('❌ Error creating application:', error);
    res.status(500).json({ 
      error: 'Failed to submit application',
      details: (error as Error).message
    });
  }
});

// ❌ 4. GET /applications/:id - MOST GENERIC (يجب أن يأتي آخراً)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const applicationId = Array.isArray(rawId) ? rawId[0] : rawId;
    
    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        jobOffer: true,
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('❌ Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// ✅ Important: Export router at the end
export default router;