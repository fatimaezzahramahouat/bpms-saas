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
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// ============================================================================
// Helper: حساب النسبة بدقة مع دعم أسماء مختلفة + fallback
// ============================================================================
function calculatePreciseScore(analysis: any): number {
  // 🔍 تشخيص: طباعة مفاتيح الرد من الـ AI
  console.log('🔍 [AI DEBUG] Keys:', Object.keys(analysis));
  console.log('🔍 [AI DEBUG] overallScore:', analysis.overallScore);
  console.log('🔍 [AI DEBUG] matchedRequirements:', analysis.matchedRequirements);
  console.log('🔍 [AI DEBUG] missingRequirements:', analysis.missingRequirements);
  console.log('🔍 [AI DEBUG] forces:', analysis.forces);
  console.log('🔍 [AI DEBUG] faiblesses:', analysis.faiblesses);

  // دالة مساعدة لاستخراج طول المصفوفة بأسماء مختلفة
  const getLen = (val: any): number => {
    if (Array.isArray(val)) return val.length;
    if (typeof val === 'string' && val.trim()) return 1;
    return 0;
  };

  // جرب أسماء مختلفة (إنجليزي/فرنسي)
  const matched = 
    getLen(analysis.matchedRequirements) ||
    getLen(analysis['exigences correspondantes']) ||
    getLen(analysis.matchedSkills) ||
    getLen(analysis.strengths) ||
    getLen(analysis.forces) ||
    0;

  const missing = 
    getLen(analysis.missingRequirements) ||
    getLen(analysis['exigences manquantes']) ||
    getLen(analysis.missingSkills) ||
    getLen(analysis.weaknesses) ||
    getLen(analysis.faiblesses) ||
    0;

  const total = matched + missing;

  // ✅ إذا وجدنا بيانات، احسب النسبة
  if (total > 0) {
    const score = Math.round((matched / total) * 100 * 100) / 100;
    console.log('📊 [CALCULATED] Matched:', matched, 'Missing:', missing, '→ Score:', score);
    return score;
  }

  // ❌ إذا لم نجد بيانات، استخدم نسبة الـ AI كـ fallback
  const aiScore = Number(analysis.overallScore);
  const fallback = (aiScore >= 0 && aiScore <= 100) ? aiScore : 75;
  console.log('📊 [FALLBACK] Using AI score:', fallback);
  return fallback;
}

// ============================================================================
// ROUTES
// ============================================================================

router.get('/test-debug', (req: Request, res: Response) => {
  res.json({ message: '✅ application.routes.ts loaded!', timestamp: new Date().toISOString() });
});

// ✅ POST /:jobOfferId/apply - مع رفع ملف CV
router.post('/:jobOfferId/apply', upload.single('cv'), async (req: Request, res: Response) => {
  try {
    const jobOfferId = req.params.jobOfferId as string;
    const { fullName, email, phone } = req.body;
    const cvFile = req.file;

    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!cvFile) return res.status(400).json({ error: 'CV file is required' });

    const cvUrl = `/uploads/cvs/${cvFile.filename}`;

    let candidate = await prisma.candidate.findUnique({ where: { email } });
    
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          fullName: fullName || 'Unknown',
          email,
          phone: phone || null,
          cv: cvUrl,
          status: 'CANDIDATE'
        }
      });
      console.log('✅ Candidate created:', candidate.id, candidate.fullName);
    }

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

    

    const jobOffer = await prisma.jobOffer.findUnique({ where: { id: jobOfferId as string } });
    if (!jobOffer) return res.status(404).json({ error: 'Job offer not found' });

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: 'APPLIED'
      }
    });

    console.log('✅ Application created:', application.id);

    // ========================================================================
    // AUTOMATIC AI ANALYSIS - Background
    // ========================================================================
    setImmediate(async () => {
      try {
        console.log('🤖 Starting automatic AI analysis for application:', application.id);
        
        // 🔧 [تعديل 1] Prompt محسّن لطلب categoryScores بشكل صريح
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

Provide a detailed JSON analysis with EXACTLY this structure:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "skills": number (0-100),
    "experience": number (0-100),
    "education": number (0-100),
    "technicalFit": number (0-100)
  },
  "matchedRequirements": ["skill1", "skill2"],
  "missingRequirements": ["skill3", "skill4"],
  "strengths": ["point1", "point2"],
  "weaknesses": ["point3", "point4"],
  "recommendation": {
    "decision": "Yes/No/Maybe",
    "priority": "HIGH/MEDIUM/LOW",
    "interviewQuestions": ["question1", "question2"],
    "notes": "summary"
  }
}

IMPORTANT: 
- All scores MUST be numbers between 0-100
- categoryScores MUST include all 4 categories with numeric values
- Respond in French
- Output ONLY valid JSON, no markdown formatting
`;

        const analysisText = await generateContent(prompt);
        const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);

        // ✅ حساب النسبة بدقة مع fallback
        const preciseScore = calculatePreciseScore(analysis);

        const ensureArray = (value: unknown): string[] => {
          if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
          if (typeof value === 'string') return value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
          return [];
        };

        // 🔧 [تعديل 2] قراءة categoryScores مع دعم الفرنسية والإنجليزية
        const getCategoryScore = (obj: any, enKey: string, frKey: string): number | null => {
          const val = obj?.categoryScores?.[enKey] ?? 
                      obj?.categoryScores?.[frKey] ?? 
                      obj?.result?.categoryScores?.[enKey] ?? 
                      obj?.result?.categoryScores?.[frKey];
          return val !== undefined ? Number(val) : null;
        };

        await prisma.aIAnalysis.create({
          data: {
            type: 'CANDIDATE_ANALYSIS',
            candidateId: candidate.id,
            jobOfferId: jobOffer.id,
            applicationId: application.id,
            
            // ✅ النسبة المحسوبة بدقة
            overallScore: preciseScore,
            
            // ✅ categoryScores مع دعم الفرنسية والإنجليزية
            skillsScore: getCategoryScore(analysis, 'skills', 'compétences'),
            experienceScore: getCategoryScore(analysis, 'experience', 'expérience'),
            educationScore: getCategoryScore(analysis, 'education', 'éducation'),
            technicalFitScore: getCategoryScore(analysis, 'technicalFit', 'adéquation technique'),
            
            matchedSkills: ensureArray(analysis.matchedRequirements || analysis.matchedSkills || analysis['exigences correspondantes'] || []),
            missingSkills: ensureArray(analysis.missingRequirements || analysis.missingSkills || analysis['exigences manquantes'] || []),
            strengths: ensureArray(analysis.strengths || analysis.forces || []),
            weaknesses: ensureArray(analysis.weaknesses || analysis.faiblesses || []),
            
            recommendation: analysis.recommendation?.decision || null,
            priority: analysis.recommendation?.priority || null,
            interviewQuestions: ensureArray(analysis.recommendation?.interviewQuestions || []),
            result: {
              ...analysis,
              categoryScores: {
                skills: analysis.categoryScores?.skills ?? analysis.categoryScores?.['compétences'] ?? analysis.result?.categoryScores?.skills ?? analysis.result?.categoryScores?.['compétences'],
                experience: analysis.categoryScores?.experience ?? analysis.categoryScores?.['expérience'] ?? analysis.result?.categoryScores?.experience ?? analysis.result?.categoryScores?.['expérience'],
                education: analysis.categoryScores?.education ?? analysis.categoryScores?.['éducation'] ?? analysis.result?.categoryScores?.education ?? analysis.result?.categoryScores?.['éducation'],
                technicalFit: analysis.categoryScores?.technicalFit ?? analysis.categoryScores?.['adéquation technique'] ?? analysis.result?.categoryScores?.technicalFit ?? analysis.result?.categoryScores?.['adéquation technique']
              }
            },
            confidence: preciseScore / 100
          }
        });

        console.log('💾 Analysis saved with score:', preciseScore, 'for application:', application.id);

      } catch (error) {
        console.error('❌ AI analysis failed:', error);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: application.status,
        createdAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to submit application', details: (error as Error).message });
  }
});

// ✅ POST / - مسار عام (بدون رفع ملف)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { candidateId, jobOfferId, fullName, email, phone, cv, skills, experience, education } = req.body;

    if (!jobOfferId || !email) return res.status(400).json({ error: 'jobOfferId and email are required' });

    const jobOfferIdStr = Array.isArray(jobOfferId) ? jobOfferId[0] : jobOfferId;

    let candidate = candidateId ? await prisma.candidate.findUnique({ where: { id: candidateId } }) : null;
    
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
    if (!jobOffer) return res.status(404).json({ error: 'Job offer not found' });

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
        
        // 🔧 [تعديل 1] Prompt محسّن لطلب categoryScores بشكل صريح (نفس الدالة الأولى)
        const prompt = `
Analyze the compatibility between this candidate and job offer:

CANDIDATE:
Name: ${candidate.fullName}
Email: ${candidate.email}
Skills: ${Array.isArray(skills) ? skills.join(', ') : 'Not specified'}
Experience: ${experience || 'Not specified'}
Education: ${education || 'Not specified'}

JOB OFFER:
Title: ${jobOffer.title}
Required Skills: ${(jobOffer.skills || []).join(', ')}
Level: ${jobOffer.level}

Provide a detailed JSON analysis with EXACTLY this structure:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "skills": number (0-100),
    "experience": number (0-100),
    "education": number (0-100),
    "technicalFit": number (0-100)
  },
  "matchedRequirements": ["skill1", "skill2"],
  "missingRequirements": ["skill3", "skill4"],
  "strengths": ["point1", "point2"],
  "weaknesses": ["point3", "point4"],
  "recommendation": {
    "decision": "Yes/No/Maybe",
    "priority": "HIGH/MEDIUM/LOW",
    "interviewQuestions": ["question1", "question2"],
    "notes": "summary"
  }
}

IMPORTANT: 
- All scores MUST be numbers between 0-100
- categoryScores MUST include all 4 categories with numeric values
- Respond in French
- Output ONLY valid JSON, no markdown formatting
`;

        const analysisText = await generateContent(prompt);
        const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);

        // ✅ حساب النسبة بدقة مع fallback
        const preciseScore = calculatePreciseScore(analysis);

        const ensureArray = (value: unknown): string[] => {
          if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
          if (typeof value === 'string') return value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
          return [];
        };

        // 🔧 [تعديل 2] قراءة categoryScores مع دعم الفرنسية والإنجليزية (نفس الدالة الأولى)
        const getCategoryScore = (obj: any, enKey: string, frKey: string): number | null => {
          const val = obj?.categoryScores?.[enKey] ?? 
                      obj?.categoryScores?.[frKey] ?? 
                      obj?.result?.categoryScores?.[enKey] ?? 
                      obj?.result?.categoryScores?.[frKey];
          return val !== undefined ? Number(val) : null;
        };

        await prisma.aIAnalysis.create({
          data: {
            type: 'CANDIDATE_ANALYSIS',
            candidateId: candidate.id,
            jobOfferId: jobOffer.id,
            applicationId: application.id,
            
            // ✅ النسبة المحسوبة بدقة
            overallScore: preciseScore,
            
            // ✅ categoryScores مع دعم الفرنسية والإنجليزية
            skillsScore: getCategoryScore(analysis, 'skills', 'compétences'),
            experienceScore: getCategoryScore(analysis, 'experience', 'expérience'),
            educationScore: getCategoryScore(analysis, 'education', 'éducation'),
            technicalFitScore: getCategoryScore(analysis, 'technicalFit', 'adéquation technique'),
            
            matchedSkills: ensureArray(analysis.matchedRequirements || analysis.matchedSkills || []),
            missingSkills: ensureArray(analysis.missingRequirements || analysis.missingSkills || []),
            strengths: ensureArray(analysis.strengths || analysis.forces || []),
            weaknesses: ensureArray(analysis.weaknesses || analysis.faiblesses || []),
            
            recommendation: analysis.recommendation?.decision || null,
            priority: analysis.recommendation?.priority || null,
            interviewQuestions: ensureArray(analysis.recommendation?.interviewQuestions || []),
            result: {
              ...analysis,
              categoryScores: {
                skills: analysis.categoryScores?.skills ?? analysis.categoryScores?.['compétences'] ?? analysis.result?.categoryScores?.skills ?? analysis.result?.categoryScores?.['compétences'],
                experience: analysis.categoryScores?.experience ?? analysis.categoryScores?.['expérience'] ?? analysis.result?.categoryScores?.experience ?? analysis.result?.categoryScores?.['expérience'],
                education: analysis.categoryScores?.education ?? analysis.categoryScores?.['éducation'] ?? analysis.result?.categoryScores?.education ?? analysis.result?.categoryScores?.['éducation'],
                technicalFit: analysis.categoryScores?.technicalFit ?? analysis.categoryScores?.['adéquation technique'] ?? analysis.result?.categoryScores?.technicalFit ?? analysis.result?.categoryScores?.['adéquation technique']
              }
            },
            confidence: preciseScore / 100
          }
        });

        console.log('💾 Analysis saved with score:', preciseScore, 'for application:', application.id);

      } catch (error) {
        console.error('❌ AI analysis failed:', error);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        candidateId: candidate.id,
        jobOfferId: jobOffer.id,
        status: application.status,
        createdAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to submit application', details: (error as Error).message });
  }
});

// ✅ GET /:id/analysis - جلب التحليل
router.get('/:id/analysis', async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.id as string;
    
    console.log('🔍 [Backend] Fetching AI analysis for application:', applicationId);
    
    const analysis = await prisma.aIAnalysis.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!analysis) {
      return res.status(404).json({ 
        error: 'Analysis not found',
        message: 'L\'analyse IA est encore en cours de traitement. Veuillez réessayer dans quelques secondes.'
      });
    }
    
    console.log('✅ [Backend] Analysis found:', {
      id: analysis.id,
      overallScore: analysis.overallScore,
      type: analysis.type
    });
    
    res.json({
      id: analysis.id,
      applicationId: analysis.applicationId,
      overallScore: analysis.overallScore || 0,
      confidence: analysis.confidence,
      priority: analysis.priority,
      recommendation: analysis.recommendation,
      matchedSkills: analysis.matchedSkills || [],
      missingSkills: analysis.missingSkills || [],
      interviewQuestions: analysis.interviewQuestions || [],
      result: analysis.result,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      categoryScores: {
        skills: analysis.skillsScore,
        experience: analysis.experienceScore,
        education: analysis.educationScore,
        technicalFit: analysis.technicalFitScore
      },
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt
    });
    
  } catch (error) {
    console.error('❌ [Backend] Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis', details: (error as Error).message });
  }
});

export default router;