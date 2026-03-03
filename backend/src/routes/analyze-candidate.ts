// backend/src/routes/analyze-candidate.ts
import { Router, Request, Response } from 'express';
import { generateContent } from '../lib/groq';
import { createAnalysisPrompt } from '../lib/prompts'; // ✅ استورد الدالة

const router = Router();

// Types
interface CVData {
  name?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  [key: string]: unknown;
}

interface JobOfferData {
  title?: string;
  requiredSkills?: string[];
  experienceRequired?: string;
  educationRequired?: string;
  [key: string]: unknown;
}

interface AnalysisResponse {
  overallScore: number;
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    technicalFit: number;
  };
  matchedRequirements: string[];
  missingRequirements: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: {
    decision: string;
    priority: string;
    interviewQuestions: string[];
    notes: string;
  };
}

interface AnalysisRequest {
  candidateId?: string;
  cvData: CVData;
  jobOfferData: JobOfferData;
}

// ✅ POST /api/analyze-candidate
router.post('/analyze-candidate', async (req: Request<{}, {}, AnalysisRequest>, res: Response) => {
  try {
    const { candidateId, cvData, jobOfferData } = req.body;

    if (!cvData || !jobOfferData) {
      return res.status(400).json({ 
        success: false, 
        error: 'CV or Job Offer data is missing' 
      });
    }

    // ✅ إنشاء الـ Prompt باستخدام الدالة الجديدة
    const prompt = createAnalysisPrompt(cvData, jobOfferData);

    // استدعاء Groq AI
    const analysisText = await generateContent(prompt);

    // Parse JSON response
    let analysis: AnalysisResponse;
    try {
      // تنظيف الرد من أي markdown أو نصوص إضافية
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

    res.status(200).json({
      success: true,
      data: {
        analysis,
        candidateId,
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

export default router;