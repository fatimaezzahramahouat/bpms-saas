// /home/manal/projet_final_BPMS/backend/src/routes/analyze-candidate.ts
import { Router, Request, Response } from 'express';
import { generateContent } from '../lib/groq';
import { createAnalysisPrompt, type CVData as FullCVData, type JobOfferData } from '../lib/prompts';
import { extractCVDataFromText, extractCVDataFromPDF, type CVData as ExtractedCVData } from '../lib/cvExtractor';
import { convertPDFtoText, validatePDF } from '../lib/pdfToTextConverter';
import prisma from '../lib/prisma';
import fs from 'fs/promises';
import fsSync from 'fs';  // For sync operations
import pdfParse from 'pdf-parse';
const pdfParseFn = (pdfParse as any).default || pdfParse;

import * as path from 'path';
import * as os from 'os';
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

// 👇 RUNTIME DIAGNOSTIC - Remove after testing
const promptsPath = require.resolve('../lib/prompts');
console.log('\n🔍 ===== PROMPTS FILE DIAGNOSTIC =====');
console.log('Resolved prompts path:', promptsPath);
try {
  const stats = fsSync.statSync(promptsPath);
  console.log('prompts.ts last modified:', stats.mtime);
} catch(e) {}
const fileContent = fsSync.readFileSync(promptsPath, 'utf-8');
console.log('File has UNIQUE ANALYSIS REQUEST?', fileContent.includes('UNIQUE ANALYSIS REQUEST') ? 'YES ✅' : 'NO ❌');
console.log('File has calculateYearsOfExperience?', fileContent.includes('calculateYearsOfExperience') ? 'YES ✅' : 'NO ❌');
console.log('File line count:', fileContent.split('\n').length);
console.log('🔍 ===== END PROMPTS DIAGNOSTIC =====\n');

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
      jobOfferData?: { title?: string; requiredSkills?: string[]; preferredSkills?: string[]; [key: string]: unknown };
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
      console.log('📦 Returning cached analysis for candidate:', candidateId, 'job:', jobOfferId);
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
          technologies: skillsArray
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
    } else // ============================================================================
// ✅ FIX: Handle BOTH local file paths AND remote URLs for CVs
// ============================================================================

if (cvUrl) {
  console.log('🔍 [CV HANDLER] Processing cvUrl:', cvUrl);
  
  try {
    // ✅ Check if it's a PDF file that needs conversion
    const isPdfFile = cvUrl.toLowerCase().endsWith('.pdf');
    const isLocalFile = cvUrl.startsWith('/') || cvUrl.startsWith('./') || cvUrl.startsWith('../');
    
    let rawText: string = '';
    let extractionMethod: string = 'Unknown';
    let textQuality: string = 'Unknown';
    let charCount: number = 0;
    
    if (isPdfFile && isLocalFile) {
      // ✅ Convert PDF to text using new converter
      console.log('📄 [PDF Handler] Converting PDF to TXT...');
      
      const fullPath = cvUrl.startsWith('/') ? cvUrl : path.join(process.cwd(), cvUrl);
      
      // Validate PDF first
      const validation = await validatePDF(fullPath);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid PDF file', 
          details: validation.error 
        });
      }
      
      // Convert PDF to text
      const conversionResult = await convertPDFtoText(fullPath);
      
      // Handle conversion failure
      if (!conversionResult.success) {
        console.error('❌ [PDF Handler] Conversion failed:', conversionResult.error);
        return res.status(400).json({
          success: false,
          error: 'CV Extraction Failed',
          details: conversionResult.error,
          qualityScore: conversionResult.qualityScore,
          suggestion: 'Please upload CV as .txt or .docx, or ensure PDF is text-based (not scanned image)'
        });
      }
      
      // Use converted text
      rawText = conversionResult.text;
      extractionMethod = 'PDF→TXT';
      textQuality = conversionResult.qualityScore || 'Unknown';
      charCount = conversionResult.charCount;
      
      console.log('✅ [PDF Handler] Conversion successful:', charCount, 'chars, quality:', textQuality);
      
    } else if (isLocalFile) {
      // ✅ Handle other local file types (txt, etc.)
      console.log('📄 Reading local file:', cvUrl);
      const fullPath = cvUrl.startsWith('/') ? cvUrl : path.join(process.cwd(), cvUrl);
      rawText = await fs.readFile(fullPath, 'utf-8');
      extractionMethod = 'Direct Text';
      textQuality = rawText.length > 500 ? 'HIGH' : rawText.length > 200 ? 'MEDIUM' : 'LOW';
      charCount = rawText.length;
      
    } else {
      // ✅ Handle REMOTE URL (http/https)
      console.log('🌐 Fetching remote URL:', cvUrl);
      
      const response = await fetch(cvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);
      
      // Try to convert
      const conversionResult = await convertPDFtoText(pdfBuffer as any);
      
      if (!conversionResult.success) {
        return res.status(400).json({
          success: false,
          error: 'CV Extraction Failed',
          details: conversionResult.error,
          qualityScore: conversionResult.qualityScore
        });
      }
      
      rawText = conversionResult.text;
      extractionMethod = 'PDF→TXT';
      textQuality = conversionResult.qualityScore || 'Unknown';
      charCount = conversionResult.charCount;
    }
    
    // ✅ Log extracted text
    console.log('📝 Extracted text length:', charCount, 'chars');
    console.log('📝 Text preview:', rawText?.substring(0, 300));
    console.log('📝 Extraction method:', extractionMethod);
    console.log('📝 Text quality:', textQuality);
    
    // ✅ Extract CV data from text
    const partialData = await extractCVDataFromText(rawText);
    
    // ✅ Build full CVData object
    extractedCVData = {
      personalInfo: partialData.personalInfo || { fullName: 'Unknown', email: '', phone: '', location: '' },
      workExperiences: partialData.workExperiences || [],
      education: partialData.education || [],
      technicalSkills: partialData.technicalSkills || { 
        frontend: [], backend: [], databases: [], devops: [], security: [], 
        cms: [], tools: [], automation: [], methodologies: [], testing: [] 
      },
      achievements: partialData.achievements || [],
      projects: partialData.projects || [],
      certifications: partialData.certifications || [],
      languages: partialData.languages || [],
      interests: partialData.interests || [],
      rawText: rawText,
      technologiesWithExperience: partialData.technologiesWithExperience || [],
      softSkills: partialData.softSkills || [],
      publicLinks: partialData.publicLinks || [],
      publicProjects: partialData.publicProjects || [],
      metadata: { 
        extractionDate: new Date().toISOString(), 
        totalYearsExperience: 0, 
        expertiseLevel: 'Unknown', 
        technologiesCount: 0,
        extractionMethod: extractionMethod,
        textQuality: textQuality as any,
        charCount: charCount
      }
    };
    
    // ✅ Log extraction results
    const totalSkills = Object.values(extractedCVData.technicalSkills).reduce(
      (acc: number, arr: any) => acc + (arr?.length || 0), 0
    );
    console.log('✅ CV processed:', {
      name: extractedCVData.personalInfo?.fullName,
      skills: totalSkills,
      textLength: rawText.length
    });
    
  } catch (error: any) {
    console.error('❌ CV processing failed:', {
      message: error?.message || error,
      cvUrl,
      stack: error?.stack
    });
    
    // ✅ Fallback: minimal valid CVData
    extractedCVData = {
      personalInfo: { fullName: 'Unknown', email: '', phone: '', location: '' },
      workExperiences: [],
      education: [],
      technicalSkills: { 
        frontend: [], backend: [], databases: [], devops: [], security: [], 
        cms: [], tools: [], automation: [], methodologies: [], testing: [] 
      },
      achievements: [], projects: [], certifications: [], languages: [], interests: [],
      rawText: `CV available at: ${cvUrl}`,
      technologiesWithExperience: [],
      softSkills: [],
      publicLinks: [],
      publicProjects: [],
      metadata: { 
        extractionDate: new Date().toISOString(), 
        totalYearsExperience: 0, 
        expertiseLevel: 'Unknown', 
        technologiesCount: 0 
      }
    };
  }
    } else {
      return res.status(400).json({ success: false, error: 'CV data is missing. Provide cvText, cvUrl, or cvData' });
    }

    console.log('🔄 Generating AI analysis...');
    
    // ===== DEEP CV EXTRACTION DIAGNOSTIC =====
    console.log('\n🔍 ===== DEEP CV METRICS DIAGNOSTIC =====');
    console.log('Request ID:', `REQ_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    console.log('Candidate ID:', candidateId);
    console.log('Candidate Name:', extractedCVData.personalInfo?.fullName);
    console.log('CV Source:', req.body.cvUrl || req.body.cvData?.source || 'cvData object');
    console.log('Extraction Method:', extractedCVData.metadata?.extractionMethod);
    console.log('Text Quality:', extractedCVData.metadata?.textQuality);
    console.log('Raw Text Length:', extractedCVData.rawText?.length || 0, 'characters');
    
    // Calculate metrics locally
    const allSkills = Object.values(extractedCVData.technicalSkills || {}).flat().filter(Boolean);
    const yearsExp = extractedCVData.workExperiences?.reduce((total: number, exp: any) => {
      const period = exp.period || '';
      const match = period.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|current|now)/i);
      if (match) {
        const start = parseInt(match[1]);
        const end = match[2].toLowerCase() === 'present' || match[2].toLowerCase() === 'now' ? new Date().getFullYear() : parseInt(match[2]);
        return total + (end - start);
      }
      const yearsMatch = period.match(/(\d+(?:\.\d+)?)\s*years?/i);
      if (yearsMatch) return total + parseFloat(yearsMatch[1]);
      return total;
    }, 0) || 0;
    
    console.log('\n📊 EXTRACTED METRICS:');
    console.log('  • Years of Experience:', yearsExp.toFixed(1), 'years');
    console.log('  • Total Technical Skills:', allSkills.length);
    console.log('  • Skills by Category:');
    console.log('    - Frontend:', extractedCVData.technicalSkills?.frontend?.length || 0);
    console.log('    - Backend:', extractedCVData.technicalSkills?.backend?.length || 0);
    console.log('    - Databases:', extractedCVData.technicalSkills?.databases?.length || 0);
    console.log('    - DevOps:', extractedCVData.technicalSkills?.devops?.length || 0);
    console.log('    - Tools:', extractedCVData.technicalSkills?.tools?.length || 0);
    console.log('  • Languages:', extractedCVData.languages?.map((l: any) => `${l.language}:${l.level}`).join(', ') || 'None');
    console.log('  • Projects:', extractedCVData.projects?.length || 0);
    console.log('  • Certifications:', extractedCVData.certifications?.length || 0);
    console.log('  • Work Experiences:', extractedCVData.workExperiences?.length || 0);
    
    console.log('\n📝 RAW TEXT PREVIEW (First 300 chars):');
    console.log(`"${extractedCVData.rawText?.substring(0, 300).replace(/\n/g, '\\n')}"`);
    // =========================================
    // ✅ FIXED: Prompt Building with Quality Validation
    // =========================================
    
    // ✅ 1. Verify CV data quality before building prompt
    if (!extractedCVData.rawText || extractedCVData.rawText.length < 100) {
      console.error('❌ [AI] CV data too short:', extractedCVData.rawText?.length || 0, 'chars');
      return res.status(400).json({ 
        success: false, 
        error: 'CV content insufficient for analysis',
        details: 'Please upload a text-based CV with more content',
        candidateId
      });
    }
    
    // ✅ 2. Build prompt using updated function with UNIQUE variable name to avoid conflicts
    console.log('🔄 [AI] Building prompt with createAnalysisPrompt...');
    const finalPromptForAI = createAnalysisPrompt(extractedCVData, jobOfferData as JobOfferData);
    
    // ✅ 3. Comprehensive quality check BEFORE sending to AI
    console.log('📊 [AI] === PROMPT QUALITY CHECK ===');
    console.log('  • finalPromptForAI length:', finalPromptForAI.length, 'chars');
    console.log('  • Contains UNIQUE?', finalPromptForAI.includes('UNIQUE ANALYSIS REQUEST'));
    console.log('  • Contains candidate name?', finalPromptForAI.includes(extractedCVData.personalInfo?.fullName || 'NOT_FOUND'));
    console.log('  • Contains skills section?', finalPromptForAI.includes('TECHNICAL SKILLS'));
    console.log('  • First 120 chars:', finalPromptForAI.substring(0, 120).replace(/\n/g, ' '));
    
    // ✅ 4. Critical validation: Reject if prompt is too short
    if (finalPromptForAI.length < 2000) {
      console.error('❌ [AI] CRITICAL: Prompt too short! Expected >2000, got:', finalPromptForAI.length);
      console.error('   Possible causes:');
      console.error('   1. createAnalysisPrompt function not returning full prompt');
      console.error('   2. extractedCVData has minimal/empty content');
      console.error('   3. TypeScript cache serving old compiled code');
    }
    console.log('📊 [AI] === END PROMPT CHECK ===');
    
    // ✅ 5. Send the VERIFIED prompt to Groq AI
    console.log('🤖 [AI] Calling Groq API with prompt length:', finalPromptForAI.length);
    const analysisText = await generateContent(finalPromptForAI);
    
    // ✅ 6. Update legacy 'prompt' variable for any downstream code that might use it
    const prompt = finalPromptForAI;
    
    // =========================================
    // ✅ END: Fixed Prompt Building Section
    // =========================================
    
    let analysis: any;
    try {
      const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanText;
      analysis = JSON.parse(jsonString);
      console.log('✅ [AI] Response parsed successfully');
    } catch (parseError: any) {
      console.error('❌ [JSON Parse Error]', parseError.message);
      console.error('Raw response preview:', analysisText.substring(0, 200));
      return res.status(500).json({ success: false, error: 'Failed to parse AI response', details: parseError.message });
    }

    // === LOCAL SCORE CALCULATION (Fallback) ===
    console.log('\n🧮 [Score] Calculating local fallback score...');
    
    const cvSkills = new Set(
      Object.values(extractedCVData.technicalSkills || {}).flat()
        .filter(Boolean).map((s: string) => s.toLowerCase().trim())
    );
    
    extractedCVData.workExperiences?.forEach((exp: any) => {
      exp.technologies?.forEach((tech: string) => cvSkills.add(tech.toLowerCase().trim()));
    });
    
    const requiredSkills = (jobOfferData.requiredSkills || []).map((s: string) => s.toLowerCase().trim());
    const preferredSkills = (jobOfferData.preferredSkills || []).map((s: string) => s.toLowerCase().trim());
    
    const matchedRequired = requiredSkills.filter(skill => cvSkills.has(skill));
    const matchedPreferred = preferredSkills.filter(skill => cvSkills.has(skill));
    const missingRequired = requiredSkills.filter(skill => !cvSkills.has(skill));
    
    const requiredScore = requiredSkills.length > 0 ? (matchedRequired.length / requiredSkills.length) * 70 : 0;
    const preferredScore = preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 30 : 0;
    const localCalculatedScore = Math.round(requiredScore + preferredScore);
    
    console.log('📊 [Score Debug] CV Skills:', cvSkills.size, '| Required:', requiredSkills.length, '| Matched:', matchedRequired.length);
    console.log('  • Required:', requiredSkills.join(', '));
    console.log('  • Matched:', matchedRequired.join(', '));
    console.log('  • Local Score:', localCalculatedScore);
    
    // Use AI score or local fallback
    const aiScore = Number(analysis.overallScore);
    const isGenericScore = [50, 60, 70, 75, 80].includes(aiScore);
    const scoreDiff = Math.abs((aiScore || 0) - localCalculatedScore);
    
    let finalScore: number;
    let scoreSource: string;
    
    if (!aiScore || (isGenericScore && scoreDiff > 15)) {
      console.log(`⚠️ [Score] Using local fallback: ${localCalculatedScore} (AI: ${aiScore})`);
      finalScore = localCalculatedScore;
      scoreSource = 'local';
      analysis.overallScore = localCalculatedScore;
      analysis.scoreSource = 'local-fallback';
    } else {
      console.log(`✅ [Score] Using AI score: ${aiScore}`);
      finalScore = aiScore;
      scoreSource = 'ai';
    }
    
    // Update matched/missing requirements
    analysis.matchedRequirements = matchedRequired;
    analysis.missingRequirements = missingRequired;
    console.log(`💾 Final score: ${finalScore} (${scoreSource})`);

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