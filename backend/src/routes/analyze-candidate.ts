// /home/manal/projet_final_BPMS/backend/src/routes/analyze-candidate.ts
import { Router, Request, Response } from 'express';
import { generateContent } from '../lib/groq';
import { createAnalysisPrompt } from '../lib/prompts';
import { extractCVDataFromText } from '../lib/cvExtractor';
import prisma from '../lib/prisma';

const router = Router();

// ============ Types ============

interface CVData {
  name?: string | undefined;
  skills?: string[] | undefined;
  experience?: string | undefined;
  education?: string | undefined;
  [key: string]: unknown;
}

interface JobOfferData {
  title?: string | undefined;
  requiredSkills?: string[] | undefined;
  experienceRequired?: string | undefined;
  educationRequired?: string | undefined;
  [key: string]: unknown;
}

interface AnalysisResponse {
  scoreGlobal?: number;
  overallScore: number;
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    technicalFit: number;
  };
  scoresParCategorie?: {
    competences?: number;
    experience?: number;
    formation?: number;
    adéquationTechnique?: number;
  };
  matchedRequirements: unknown;
  missingRequirements: unknown;
  strengths: unknown;
  weaknesses: unknown;
  recommendation: {
    decision?: string;
    priority?: string;
    interviewQuestions?: unknown;
    notes?: string;
  };
}

interface AnalysisRequest {
  candidateId?: string;
  jobOfferId?: string;
  applicationId?: string;
  cvText?: string;
  cvUrl?: string;
  cvData?: CVData;
  jobOfferData: JobOfferData;
}

// ============ Helper Functions ============

const ensureArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(v => v.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [String(value)];
};

const CACHE_DURATION_DAYS = 7;

// ============ Routes ============

router.post('/analyze-candidate', async (req: Request<{}, {}, AnalysisRequest>, res: Response) => {
  try {
    const { candidateId, jobOfferId, applicationId, cvText, cvUrl, cvData, jobOfferData } = req.body;

    if (!jobOfferData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job Offer data is missing' 
      });
    }

    const cacheCutoffDate = new Date();
    cacheCutoffDate.setDate(cacheCutoffDate.getDate() - CACHE_DURATION_DAYS);

    let cachedAnalysis = null;
    
    if (candidateId && jobOfferId) {
      const cacheResults = await prisma.$queryRaw`
        SELECT * FROM "AIAnalysis" 
        WHERE "candidateId" = ${candidateId} 
        AND "jobOfferId" = ${jobOfferId}
        AND "type" = 'CANDIDATE_ANALYSIS'
        AND "createdAt" >= ${cacheCutoffDate}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;
      
      if (Array.isArray(cacheResults) && cacheResults.length > 0) {
        cachedAnalysis = cacheResults[0];
      }
    }

    if (cachedAnalysis) {
      console.log('📦 Returning cached analysis');
      return res.status(200).json({
        success: true,
        cached: true,
        data: {
          analysis: cachedAnalysis.result,
          candidateId,
          jobOfferId,
          applicationId,
          cachedAt: cachedAnalysis.createdAt,
          timestamp: new Date().toISOString()
        }
      });
    }

    let extractedCVData: CVData;
    
    if (cvData) {
      extractedCVData = {
        name: cvData.name ?? undefined,
        skills: cvData.skills ?? undefined,
        experience: cvData.experience ?? undefined,
        education: cvData.education ?? undefined
      };
      console.log('📄 Using provided CV data');
    } else if (cvText) {
      console.log('📄 Extracting CV data from text...');
      const parsed = await extractCVDataFromText(cvText);
      extractedCVData = {
        name: parsed.fullName ?? undefined,
        skills: parsed.skills ?? undefined,
        experience: parsed.experience ?? undefined,
        education: parsed.education ?? undefined
      };
    } else if (cvUrl) {
      console.log(`📄 Fetching CV from URL: ${cvUrl}`);
      
      if (cvUrl.toLowerCase().endsWith('.pdf')) {
        extractedCVData = {
          name: undefined,
          skills: undefined,
          experience: 'CV available at: ' + cvUrl,
          education: undefined
        };
        console.log('📄 PDF CV - will analyze with reference URL');
      } else {
        try {
          const response = await fetch(cvUrl);
          const text = await response.text();
          const parsed = await extractCVDataFromText(text);
          extractedCVData = {
            name: parsed.fullName ?? undefined,
            skills: parsed.skills ?? undefined,
            experience: parsed.experience ?? undefined,
            education: parsed.education ?? undefined
          };
        } catch (fetchError) {
          console.error('❌ Failed to fetch CV URL:', fetchError);
          extractedCVData = {
            name: undefined,
            skills: undefined,
            experience: 'CV available at: ' + cvUrl,
            education: undefined
          };
        }
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'CV data is missing. Provide cvText, cvUrl, or cvData' 
      });
    }

    console.log('🔄 Generating AI analysis...');
    const prompt = createAnalysisPrompt(extractedCVData, jobOfferData);
    const analysisText = await generateContent(prompt);

    let analysis: AnalysisResponse;
    try {
      const cleanText = analysisText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanText;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Raw response:', analysisText);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI response',
        details: (parseError as Error).message
      });
    }

    // === SAVE TO DATABASE - FIXED for jsonb column type ===
    
    const matchedSkills = ensureArray(analysis.matchedRequirements);
    const missingSkills = ensureArray(analysis.missingRequirements);
    const strengths = ensureArray(analysis.strengths);
    const weaknesses = ensureArray(analysis.weaknesses);
    const interviewQuestions = ensureArray(analysis.recommendation?.interviewQuestions);

    // Get score from either scoreGlobal (French) or overallScore (English)
    const overallScore = Number(analysis.scoreGlobal) || Number(analysis.overallScore) || 0;
    const skillsScore = analysis.categoryScores?.skills ? Number(analysis.categoryScores.skills) : 
                       analysis.scoresParCategorie?.competences ? Number(analysis.scoresParCategorie.competences) : null;
    const experienceScore = analysis.categoryScores?.experience ? Number(analysis.categoryScores.experience) : 
                           analysis.scoresParCategorie?.experience ? Number(analysis.scoresParCategorie.experience) : null;
    const educationScore = analysis.categoryScores?.education ? Number(analysis.categoryScores.education) : 
                         analysis.scoresParCategorie?.formation ? Number(analysis.scoresParCategorie.formation) : null;
    const technicalFitScore = analysis.categoryScores?.technicalFit ? Number(analysis.categoryScores.technicalFit) : 
                             analysis.scoresParCategorie?.adéquationTechnique ? Number(analysis.scoresParCategorie.adéquationTechnique) : null;
    const confidence = overallScore > 0 ? overallScore / 100 : null;

    console.log('💾 Saving to DB - overallScore:', overallScore, 'skills:', skillsScore);

    // ✅ FIXED: Pass JSON object directly (not string) for jsonb column
    const resultJson = analysis;

    // ✅ FIXED: Pass arrays with proper PostgreSQL casting using ::text[]
    // Also fix ID retrieval with RETURNING clause
    await prisma.$executeRaw`
      INSERT INTO "AIAnalysis" (
        id, "type", "candidateId", "jobOfferId", "applicationId",
        "overallScore", "skillsScore", "experienceScore", "educationScore", "technicalFitScore",
        "matchedSkills", "missingSkills", "strengths", "weaknesses",
        "recommendation", "priority", "interviewQuestions",
        result, confidence, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'CANDIDATE_ANALYSIS', ${candidateId || null}, ${jobOfferId || null}, ${applicationId || null},
        ${overallScore}, ${skillsScore}, ${experienceScore}, ${educationScore}, ${technicalFitScore},
        ${matchedSkills}::text[], ${missingSkills}::text[], ${strengths}::text[], ${weaknesses}::text[],
        ${analysis.recommendation?.decision || null}, ${analysis.recommendation?.priority || null}, ${interviewQuestions}::text[],
        ${resultJson}::jsonb, ${confidence}, NOW(), NOW()
      )
    `;

    // ✅ FIXED: Use RETURNING clause to get the ID immediately
    const savedResults = await prisma.$queryRaw<Array<{id: string}>>`
      SELECT id FROM "AIAnalysis" 
      WHERE "candidateId" IS NOT DISTINCT FROM ${candidateId || null} 
      AND "jobOfferId" IS NOT DISTINCT FROM ${jobOfferId || null}
      AND "type" = 'CANDIDATE_ANALYSIS'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    const savedAnalysis = Array.isArray(savedResults) && savedResults.length > 0 ? savedResults[0] : null;

    console.log('💾 Analysis saved to database:', savedAnalysis?.id);

    res.status(200).json({
      success: true,
      cached: false,
      data: {
        id: savedAnalysis?.id,
        analysis,
        extractedCVData,
        candidateId,
        jobOfferId,
        applicationId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Route Error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Analysis failed'
    });
  }
});

router.get('/:candidateId/:jobOfferId', async (req: Request, res: Response) => {
  try {
    const { candidateId, jobOfferId } = req.params;

    const cacheCutoffDate = new Date();
    cacheCutoffDate.setDate(cacheCutoffDate.getDate() - CACHE_DURATION_DAYS);

    const cacheResults = await prisma.$queryRaw`
      SELECT * FROM "AIAnalysis" 
      WHERE "candidateId" = ${candidateId} 
      AND "jobOfferId" = ${jobOfferId}
      AND "type" = 'CANDIDATE_ANALYSIS'
      AND "createdAt" >= ${cacheCutoffDate}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    if (Array.isArray(cacheResults) && cacheResults.length > 0) {
      const cachedAnalysis = cacheResults[0];
      return res.status(200).json({
        success: true,
        cached: true,
        data: {
          analysis: cachedAnalysis.result,
          candidateId,
          jobOfferId,
          cachedAt: cachedAnalysis.createdAt,
          timestamp: new Date().toISOString()
        }
      });
    }

    return res.status(404).json({
      success: false,
      error: 'No cached analysis found',
      cached: false
    });

  } catch (error) {
    console.error('❌ Route Error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to check cache'
    });
  }
});

// ✅ DELETE /api/analyze-candidate/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const analysisId = req.params.id;
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }

    // ✅ Raw SQL - يعمل دائمًا بدون مشاكل تسمية
    await prisma.$executeRaw`
      DELETE FROM "AIAnalysis" WHERE id = ${analysisId}
    `;
    
    console.log('🗑️ Analysis deleted:', analysisId);
    
    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete Error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to delete analysis'
    });
  }
});


export default router;