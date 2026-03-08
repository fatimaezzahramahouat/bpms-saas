// /home/manal/projet_final_BPMS/backend/src/routes/analyze-candidate.ts
import { Router, Request, Response } from 'express';
import { generateContent } from '../lib/groq';
import { createAnalysisPrompt, type CVData as FullCVData, type JobOfferData } from '../lib/prompts';
import { extractCVDataFromText, type CVData as ExtractedCVData } from '../lib/cvExtractor';
import prisma from '../lib/prisma';

const router = Router();

// ============ Helper Functions ============

const ensureArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(v => v.length > 0);
  }
  if (typeof value === 'string') {
    return value.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0);
  }
  return [];
};

const CACHE_DURATION_DAYS = 7;

// ============ Routes ============

router.post('/analyze-candidate', async (req: Request, res: Response) => {
  try {
    const { candidateId, jobOfferId, applicationId, cvText, cvUrl, cvData, jobOfferData } = req.body as {
      candidateId?: string;
      jobOfferId?: string;
      applicationId?: string;
      cvText?: string;
      cvUrl?: string;
      cvData?: { name?: string; skills?: string | string[]; experience?: string; education?: string; [key: string]: unknown };
      jobOfferData?: { title?: string; requiredSkills?: string[]; [key: string]: unknown };
    };

    if (!jobOfferData) {
      return res.status(400).json({ success: false, error: 'Job Offer data is missing' });
    }

    const cacheCutoffDate = new Date();
    cacheCutoffDate.setDate(cacheCutoffDate.getDate() - CACHE_DURATION_DAYS);

    let cachedAnalysis: any = null;
    
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

    let extractedCVData: FullCVData;
    
    // ✅ FIX: Transform frontend CV data into the full structure expected by createAnalysisPrompt
    if (cvData) {
      // ✅ [تصحيح 1] type guard لـ skills
      let skillsArray: string[] = [];
      if (Array.isArray(cvData.skills)) {
        skillsArray = cvData.skills.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof cvData.skills === 'string') {
        skillsArray = cvData.skills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      }
      
      // ✅ [تصحيح 2] استخدام 'achievements' بدلاً من 'achievementDescriptions'
      extractedCVData = {
        personalInfo: {
          fullName: typeof cvData.name === 'string' ? cvData.name : 'Non spécifié',
          email: typeof (cvData as any).email === 'string' ? (cvData as any).email : 'Non spécifié',
          phone: typeof (cvData as any).phone === 'string' ? (cvData as any).phone : 'Non spécifié',
          location: typeof (cvData as any).location === 'string' ? (cvData as any).location : 'Non spécifié',
          linkedin: typeof (cvData as any).linkedin === 'string' ? (cvData as any).linkedin : undefined,
          website: typeof (cvData as any).website === 'string' ? (cvData as any).website : undefined,
          professionalTitle: typeof (cvData as any).professionalTitle === 'string' ? (cvData as any).professionalTitle : undefined,
          summary: typeof (cvData as any).summary === 'string' ? (cvData as any).summary : undefined
        },
        workExperiences: cvData.experience ? [{
          title: (cvData as any).jobTitle || 'Expérience professionnelle',
          company: (cvData as any).company || 'Entreprise non spécifiée',
          period: cvData.experience,
          location: (cvData as any).location || 'Non spécifié',
          responsibilities: skillsArray.length > 0 ? skillsArray : ['Compétences mentionnées'],
          technologies: skillsArray,
          achievements: (cvData as any).achievements || []
        }] : [],
        education: cvData.education ? [{
          degree: cvData.education,
          school: 'Non spécifié',
          period: 'Non spécifié',
          location: 'Non spécifié',
          field: undefined
        }] : [],
        technicalSkills: {
          frontend: skillsArray.filter(s => /react|angular|vue|html|css|javascript|typescript|jquery|bootstrap|tailwind/i.test(s)),
          backend: skillsArray.filter(s => /node|express|laravel|php|python|java|c#|asp\.net|golang|rust|sql|mysql|postgresql/i.test(s)),
          databases: skillsArray.filter(s => /mysql|postgresql|mongodb|redis|oracle|sql server|firebase/i.test(s)),
          devops: skillsArray.filter(s => /docker|kubernetes|jenkins|ci\/cd|git|aws|azure|gcp|terraform|ansible/i.test(s)),
          security: skillsArray.filter(s => /security|owasp|ssl|tls|encryption/i.test(s)),
          cms: skillsArray.filter(s => /wordpress|prestashop|shopify|drupal|joomla/i.test(s)),
          tools: skillsArray.filter(s => /vscode|intellij|git|docker|postman|figma|adobe/i.test(s)),
          automation: skillsArray.filter(s => /n8n|zapier|selenium|automation/i.test(s)),
          methodologies: skillsArray.filter(s => /agile|scrum|kanban|tdd|bdd|uml/i.test(s)),
          testing: skillsArray.filter(s => /jest|mocha|cypress|selenium|testing|unittest|junit/i.test(s))
        },
        achievements: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
        rawText: `CANDIDAT: ${cvData.name || 'Non spécifié'}\n\nCOMPÉTENCES: ${skillsArray.join(', ')}\n\nEXPÉRIENCE PROFESSIONNELLE: ${cvData.experience || 'Non spécifiée'}\n\nFORMATION: ${cvData.education || 'Non spécifiée'}\n\nAUTRES DÉTAILS: ${JSON.stringify({
          email: (cvData as any).email,
          phone: (cvData as any).phone,
          location: (cvData as any).location,
          linkedin: (cvData as any).linkedin,
          professionalTitle: (cvData as any).professionalTitle,
          summary: (cvData as any).summary
        })}`,
        technologiesWithExperience: skillsArray.map(name => ({
          name,
          category: 'general',
          context: 'production' as const,
          proficiency: 'intermédiaire' as const
        })),
        softSkills: [],
        publicLinks: [],
        publicProjects: [],
        metadata: {
          extractionDate: new Date().toISOString(),
          totalYearsExperience: 0,
          expertiseLevel: 'Non spécifié',
          technologiesCount: skillsArray.length
        }
      };
      console.log('📄 Using transformed CV data with skills:', skillsArray.length, 'items');
    } else if (cvText) {
      console.log('📄 Extracting CV data from text...');
      // ✅ [تصحيح 3+4] التعامل مع Partial<CVData>
      const partialData = await extractCVDataFromText(cvText);
      extractedCVData = {
        personalInfo: partialData.personalInfo || { fullName: 'Non spécifié', email: '', phone: '', location: '' },
        workExperiences: partialData.workExperiences || [],
        education: partialData.education || [],
        technicalSkills: partialData.technicalSkills || { frontend: [], backend: [], databases: [], devops: [], security: [], cms: [], tools: [], automation: [], methodologies: [], testing: [] },
        achievements: partialData.achievements || [],
        projects: partialData.projects || [],
        certifications: partialData.certifications || [],
        languages: partialData.languages || [],
        interests: partialData.interests || [],
        rawText: partialData.rawText || cvText,
        technologiesWithExperience: partialData.technologiesWithExperience || [],
        softSkills: partialData.softSkills || [],
        publicLinks: partialData.publicLinks || [],
        publicProjects: partialData.publicProjects || [],
        metadata: partialData.metadata || { extractionDate: new Date().toISOString(), totalYearsExperience: 0, expertiseLevel: 'Non spécifié', technologiesCount: 0 }
      };
    } else if (cvUrl) {
      console.log(`📄 Fetching CV from URL: ${cvUrl}`);
      if (cvUrl.toLowerCase().endsWith('.pdf')) {
        // For PDF URLs, use minimal data
        extractedCVData = {
          personalInfo: { fullName: 'Non spécifié', email: '', phone: '', location: '' },
          workExperiences: [],
          education: [],
          technicalSkills: { frontend: [], backend: [], databases: [], devops: [], security: [], cms: [], tools: [], automation: [], methodologies: [], testing: [] },
          achievements: [],
          projects: [],
          certifications: [],
          languages: [],
          interests: [],
          rawText: `CV available at: ${cvUrl}`,
          technologiesWithExperience: [],
          softSkills: [],
          publicLinks: [],
          publicProjects: [],
          metadata: { extractionDate: new Date().toISOString(), totalYearsExperience: 0, expertiseLevel: 'Non spécifié', technologiesCount: 0 }
        };
      } else {
        try {
          const response = await fetch(cvUrl);
          const text = await response.text();
          const partialData = await extractCVDataFromText(text);
          // ✅ [تصحيح 3+4] التعامل مع Partial<CVData>
          extractedCVData = {
            personalInfo: partialData.personalInfo || { fullName: 'Non spécifié', email: '', phone: '', location: '' },
            workExperiences: partialData.workExperiences || [],
            education: partialData.education || [],
            technicalSkills: partialData.technicalSkills || { frontend: [], backend: [], databases: [], devops: [], security: [], cms: [], tools: [], automation: [], methodologies: [], testing: [] },
            achievements: partialData.achievements || [],
            projects: partialData.projects || [],
            certifications: partialData.certifications || [],
            languages: partialData.languages || [],
            interests: partialData.interests || [],
            rawText: partialData.rawText || text,
            technologiesWithExperience: partialData.technologiesWithExperience || [],
            softSkills: partialData.softSkills || [],
            publicLinks: partialData.publicLinks || [],
            publicProjects: partialData.publicProjects || [],
            metadata: partialData.metadata || { extractionDate: new Date().toISOString(), totalYearsExperience: 0, expertiseLevel: 'Non spécifié', technologiesCount: 0 }
          };
        } catch (fetchError) {
          console.error('❌ Failed to fetch CV URL:', fetchError);
          extractedCVData = {
            personalInfo: { fullName: 'Non spécifié', email: '', phone: '', location: '' },
            workExperiences: [],
            education: [],
            technicalSkills: { frontend: [], backend: [], databases: [], devops: [], security: [], cms: [], tools: [], automation: [], methodologies: [], testing: [] },
            achievements: [],
            projects: [],
            certifications: [],
            languages: [],
            interests: [],
            rawText: `CV available at: ${cvUrl}`,
            technologiesWithExperience: [],
            softSkills: [],
            publicLinks: [],
            publicProjects: [],
            metadata: { extractionDate: new Date().toISOString(), totalYearsExperience: 0, expertiseLevel: 'Non spécifié', technologiesCount: 0 }
          };
        }
      }
    } else {
      return res.status(400).json({ success: false, error: 'CV data is missing. Provide cvText, cvUrl, or cvData' });
    }

    console.log('🔄 Generating AI analysis...');
    
    // ✅ DEBUG: Log what data is being sent to AI
    const skillsFromCv = cvData?.skills ? (Array.isArray(cvData.skills) ? cvData.skills : cvData.skills.split(/[,;\n]/)) : [];
    console.log('📤 Data being analyzed:');
    console.log('  - Candidate:', cvData?.name || 'Unknown');
    console.log('  - Skills count:', skillsFromCv.length);
    console.log('  - Experience:', cvData?.experience?.substring(0, 100) || 'None');
    console.log('  - Job:', jobOfferData?.title || 'Unknown');
    console.log('  - Required skills:', jobOfferData?.requiredSkills?.length || 0);
    
    const prompt = createAnalysisPrompt(extractedCVData, jobOfferData as JobOfferData);
    const analysisText = await generateContent(prompt);

    let analysis: any;
    try {
      const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanText;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Raw response:', analysisText);
      return res.status(500).json({ success: false, error: 'Failed to parse AI response', details: (parseError as Error).message });
    }

    // === SAVE TO DATABASE ===
    const matchedSkills = ensureArray(analysis.matchedRequirements);
    const missingSkills = ensureArray(analysis.missingRequirements);
    const strengths = ensureArray(analysis.strengths);
    const weaknesses = ensureArray(analysis.weaknesses);
    const interviewQuestions = ensureArray(analysis.recommendation?.interviewQuestions);

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

    const resultJson = analysis;

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

    const savedResults = await prisma.$queryRaw`
      SELECT id FROM "AIAnalysis" 
      WHERE "candidateId" IS NOT DISTINCT FROM ${candidateId || null} 
      AND "jobOfferId" IS NOT DISTINCT FROM ${jobOfferId || null}
      AND "type" = 'CANDIDATE_ANALYSIS'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    const savedAnalysis = Array.isArray(savedResults) && savedResults.length > 0 ? (savedResults as any[])[0] : null;

    console.log('💾 Analysis saved to database:', (savedAnalysis as any)?.id);

    res.status(200).json({
      success: true,
      cached: false,
      data: {
        id: (savedAnalysis as any)?.id,
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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const analysisId = req.params.id;
    
    if (!analysisId) {
      return res.status(400).json({ success: false, error: 'Analysis ID is required' });
    }

    await prisma.$executeRaw`DELETE FROM "AIAnalysis" WHERE id = ${analysisId}`;
    
    console.log('🗑️ Analysis deleted:', analysisId);
    
    res.status(200).json({ success: true, message: 'Analysis deleted successfully' });
    
  } catch (error) {
    console.error('❌ Delete Error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to delete analysis'
    });
  }
});

export default router;