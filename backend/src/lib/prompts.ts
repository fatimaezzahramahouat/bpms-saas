// /home/manal/projet_final_BPMS/backend/src/lib/prompts.ts

// Import CVData from cvExtractor to ensure compatibility
import { CVData } from './cvExtractor';
export type { CVData };

// ============================================================================
// INTERFACES - Dynamic input structures
// ============================================================================

export interface JobOfferData {
  title?: string;
  company?: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceRequired?: string;
  educationRequired?: string;
  responsibilities?: string[];
  location?: string;
  salary?: string;
  contractType?: string;
  workMode?: string;
  level?: string;
  budget?: number;
  [key: string]: unknown;
}

// ============================================================================
// HELPER: Calculate years of experience from work history
// ============================================================================

function calculateYearsOfExperience(workExperiences: any[]): number {
  if (!workExperiences || workExperiences.length === 0) return 0;
  
  let totalMonths = 0;
  
  workExperiences.forEach(exp => {
    const period = exp.period || '';
    
    // Match patterns like "2020-2023", "2020 to 2023", "Jan 2020 - Present"
    const yearMatch = period.match(/(\d{4})\s*[-–to]+\s*(\d{4}|Present|current|now)/i);
    
    // Match patterns like "3 years", "2 ans"
    const yearsMatch = period.match(/(\d+(?:\.\d+)?)\s*(?:years?|ans|ans)/i);
    
    if (yearMatch) {
      const start = parseInt(yearMatch[1]);
      const endYear = yearMatch[2].toLowerCase() === 'present' || yearMatch[2].toLowerCase() === 'current' || yearMatch[2].toLowerCase() === 'now' 
        ? new Date().getFullYear() 
        : parseInt(yearMatch[2]);
      totalMonths += (endYear - start) * 12;
    } else if (yearsMatch) {
      totalMonths += parseFloat(yearsMatch[1]) * 12;
    }
  });
  
  return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// ADVANCED PROMPT FUNCTION - Deep CV Metrics Extraction
// ============================================================================

/**
 * Creates a comprehensive analysis prompt with deep CV metrics extraction.
 * This prompt:
 * - Extracts ALL candidate information in detail
 * - Calculates years of experience from work history
 * - Counts and categorizes technical skills
 * - Extracts language proficiency levels
 * - Includes projects, certifications, achievements
 * - Provides unique request ID to prevent duplicate analysis
 * - Forces differentiated scores based on actual data
 * - Includes raw CV text excerpt for context (first 1500 chars)
 */
export function createAnalysisPrompt(cvData: CVData, jobOfferData: JobOfferData): string {
  
  // ✅ VALIDATION: Check for invalid/fallback CV data
  const rawTextLength = cvData?.rawText?.length || 0;
  const textQuality = cvData?.metadata?.textQuality as string | undefined;
  const extractionMethod = cvData?.metadata?.extractionMethod as string | undefined;
  
  // Check if quality is explicitly failed
  if (textQuality === 'FAILED') {
    console.error('❌ [Prompt Gen] REJECTING - Text quality FAILED:', {
      name: cvData?.personalInfo?.fullName,
      rawTextLength,
      extractionMethod,
      textQuality
    });
    throw new Error('Cannot generate prompt: CV text extraction failed (scanned/image PDF detected). Please upload a text-based PDF, .txt, or .docx file.');
  }
  
  if (rawTextLength < 50) {
    console.error('❌ [Prompt Gen] REJECTING - Raw text too short:', rawTextLength);
    throw new Error('Cannot generate prompt: CV raw text is too short (less than 50 chars)');
  }
  
  // ✅ UNIQUE REQUEST ID
  const uniqueId = `REQ_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  
  // ✅ Calculate deep metrics
  const yearsOfExperience = calculateYearsOfExperience(cvData?.workExperiences || []);
  
  // ✅ Count ALL skills from ALL categories
  const allSkillsArray: string[] = [];
  if (cvData?.technicalSkills) {
    const categories = [
      cvData.technicalSkills.frontend,
      cvData.technicalSkills.backend,
      cvData.technicalSkills.databases,
      cvData.technicalSkills.devops,
      cvData.technicalSkills.tools,
      cvData.technicalSkills.automation,
      cvData.technicalSkills.cms,
      cvData.technicalSkills.security,
      cvData.technicalSkills.methodologies,
      cvData.technicalSkills.testing
    ];
    
    categories.forEach(cat => {
      if (Array.isArray(cat)) {
        cat.forEach(skill => {
          if (typeof skill === 'string' && skill.trim()) {
            allSkillsArray.push(skill.trim());
          }
        });
      }
    });
  }
  
  // Add skills from work experiences
  if (Array.isArray(cvData?.workExperiences)) {
    cvData.workExperiences.forEach(exp => {
      if (Array.isArray(exp?.technologies)) {
        exp.technologies.forEach(tech => {
          if (typeof tech === 'string' && tech.trim()) {
            allSkillsArray.push(tech.trim());
          }
        });
      }
    });
  }
  
  // Remove duplicates
  const uniqueSkills = [...new Set(allSkillsArray.map(s => s.toLowerCase()))].map(s => 
    allSkillsArray.find(sk => sk.toLowerCase() === s)
  ).filter(Boolean) as string[];
  
  const skillCount = uniqueSkills.length;
  
  // ✅ Extract languages
  const languages = cvData?.languages?.map((l: any) => `${l.language}: ${l.level || 'Not specified'}`).join(', ') || 'Not specified';
  
  // ✅ Extract certifications
  const certifications = cvData?.certifications?.map(c => c.name).join(', ') || 'None';
  const certificationsCount = cvData?.certifications?.length || 0;
  
  // ✅ Projects count
  const projectsCount = cvData?.projects?.length || 0;
  
  // ✅ Extract skills by category for display
  const skillsByCategory = cvData?.technicalSkills ? `
• Frontend: ${cvData.technicalSkills.frontend?.join(', ') || 'None'}
• Backend: ${cvData.technicalSkills.backend?.join(', ') || 'None'}
• Databases: ${cvData.technicalSkills.databases?.join(', ') || 'None'}
• DevOps: ${cvData.technicalSkills.devops?.join(', ') || 'None'}
• Tools: ${cvData.technicalSkills.tools?.join(', ') || 'None'}
• CMS: ${cvData.technicalSkills.cms?.join(', ') || 'None'}
• Testing: ${cvData.technicalSkills.testing?.join(', ') || 'None'}
• Methodologies: ${cvData.technicalSkills.methodologies?.join(', ') || 'None'}
` : '• No technical skills extracted';
  
  // ✅ Build work experience section
  let experienceSection = '\n💼 WORK EXPERIENCE:\n';
  if (cvData?.workExperiences && cvData.workExperiences.length > 0) {
    cvData.workExperiences.forEach((exp, index) => {
      experienceSection += `
  [Experience ${index + 1}]
  • Position: ${exp.title || 'Not specified'}
  • Company: ${exp.company || 'Not specified'}
  • Period: ${exp.period || 'Not specified'}
  • Location: ${exp.location || 'Not specified'}
  • Responsibilities: ${exp.responsibilities?.slice(0, 3).join(', ') || 'Not specified'}
  • Technologies: ${exp.technologies?.join(', ') || 'Not specified'}
`;
    });
  } else {
    experienceSection += '  • No work experience listed\n';
  }
  
  // ✅ Build education section
  let educationSection = '\n🎓 EDUCATION:\n';
  if (cvData?.education && cvData.education.length > 0) {
    cvData.education.forEach(edu => {
      educationSection += `
  • Degree: ${edu.degree || 'Not specified'}
  • School: ${edu.school || 'Not specified'}
  • Field: ${edu.field || 'Not specified'}
  • Period: ${edu.period || 'Not specified'}
`;
    });
  } else {
    educationSection += '  • No education listed\n';
  }
  
  // ✅ Build achievements section
  let achievementsSection = '\n🏆 ACHIEVEMENTS & CERTIFICATIONS:\n';
  if (cvData?.achievements && cvData.achievements.length > 0) {
    cvData.achievements.forEach(a => {
      achievementsSection += `  • ${a.description}\n`;
    });
  } else {
    achievementsSection += '  • No achievements listed\n';
  }
  
  if (certifications !== 'None') {
    achievementsSection += `\n📜 Certifications: ${certifications}\n`;
  }
  
  // ✅ Build projects section
  let projectsSection = '\n🌐 PROJECTS:\n';
  if (cvData?.projects && cvData.projects.length > 0) {
    cvData.projects.forEach(p => {
      projectsSection += `
  • ${p.name || 'Unnamed Project'}: ${p.description?.substring(0, 100) || 'No description'}
    Technologies: ${p.technologies?.join(', ') || 'Not specified'}
`;
    });
  } else {
    projectsSection += '  • No projects listed\n';
  }
  
  // ✅ Raw CV text excerpt
  const rawTextExcerpt = cvData?.rawText?.substring(0, 1500) || 'No text available';
  
  // ✅ Job requirements
  const jobTitle = jobOfferData?.title || 'Not specified';
  const jobLevel = jobOfferData?.level || 'Not specified';
  const requiredSkills = jobOfferData?.requiredSkills?.join(', ') || 'Not specified';
  const preferredSkills = jobOfferData?.preferredSkills?.join(', ') || 'None';
  const experienceRequired = jobOfferData?.experienceRequired || 'Not specified';
  const educationRequired = jobOfferData?.educationRequired || 'Not specified';
  
  // ✅ BUILD COMPREHENSIVE PROMPT
  const promptOutput = `
🎯 UNIQUE ANALYSIS REQUEST [ID: ${uniqueId}]
⏰ Timestamp: ${timestamp}
📄 Extraction Quality: ${textQuality || 'Unknown'}
📝 CV Text Length: ${rawTextLength} characters

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CANDIDATE COMPREHENSIVE PROFILE:

• Full Name: ${cvData?.personalInfo?.fullName || 'Unknown'}
• Email: ${cvData?.personalInfo?.email || 'N/A'}
• Phone: ${cvData?.personalInfo?.phone || 'N/A'}
• Location: ${cvData?.personalInfo?.location || 'N/A'}
• Professional Title: ${cvData?.personalInfo?.professionalTitle || 'N/A'}
• LinkedIn: ${cvData?.personalInfo?.linkedin || 'N/A'}

📊 KEY METRICS (Extracted from CV):
• Total Years of Experience: ${yearsOfExperience} years
• Total Technical Skills: ${skillCount} skills
• Number of Projects: ${projectsCount}
• Number of Certifications: ${certificationsCount}
• Languages: ${languages}

${experienceSection}

${educationSection}

🛠️ TECHNICAL SKILLS (By Category):
${skillsByCategory}

${achievementsSection}

${projectsSection}

📄 RAW CV TEXT EXCERPT (First 1500 chars for additional context):
${rawTextExcerpt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 JOB REQUIREMENTS:
• Position: ${jobTitle}
• Level: ${jobLevel}
• Required Skills: ${requiredSkills}
• Preferred Skills: ${preferredSkills}
• Experience Required: ${experienceRequired}
• Education Required: ${educationRequired}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ YOUR ANALYSIS TASK:

You are an expert technical recruiter. Analyze this candidate's fit for the position.

⚠️ CRITICAL ANALYSIS REQUIREMENTS:

1. **EXPERIENCE CALCULATION:**
   - Calculate total years from work history
   - Compare against job requirement
   - Score: (candidateYears / requiredYears) × 100, capped at 100

2. **SKILL MATCHING:**
   - Compare EACH candidate skill against required skills list
   - Count EXACT matches (case-insensitive)
   - matchedRequirements = ALL skills that match
   - missingRequirements = ALL required skills not found
   - Skills Score: (matchedCount / requiredCount) × 100

3. **TECHNOLOGY MASTERY ASSESSMENT:**
   - Count technologies mentioned with context (projects, work)
   - Categorize: Advanced (5+ mentions), Intermediate (2-4), Beginner (1)
   - Include in technicalFit score

4. **LANGUAGE PROFICIENCY:**
   - Extract language levels from CV (A1, A2, B1, B2, C1, C2, Fluent, Native)
   - Compare against job language requirements
   - Include in overall assessment

5. **EDUCATION & CERTIFICATIONS:**
   - Check if degree matches field requirement
   - Count relevant certifications
   - Include in education score

6. **PROJECTS & ACHIEVEMENTS:**
   - Count relevant projects
   - Check if technologies match job requirements
   - Include as bonus points in overall score

📊 REQUIRED JSON OUTPUT FORMAT:
{
  "overallScore": number (0-100, calculated from weighted average below),
  "categoryScores": {
    "skills": number (0-100, based on skill match percentage),
    "experience": number (0-100, based on years match),
    "education": number (0-100, based on degree/certifications),
    "technicalFit": number (0-100, based on technology mastery)
  },
  "detailedMetrics": {
    "yearsOfExperience": number,
    "requiredYears": number,
    "totalSkills": number,
    "matchedSkillsCount": number,
    "missingSkillsCount": number,
    "technologyMastery": {
      "advanced": number,
      "intermediate": number,
      "beginner": number
    },
    "languages": [{"name": string, "level": string}],
    "projectsCount": number,
    "certificationsCount": number
  },
  "matchedRequirements": [string],
  "missingRequirements": [string],
  "strengths": [string],
  "weaknesses": [string],
  "recommendation": {
    "decision": "HIRE" | "INTERVIEW" | "REJECT",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "reasoning": string,
    "interviewQuestions": [string, string, string]
  }
}

⚠️ SCORING GUIDELINES (MUST FOLLOW):

| Metric | Weight | Calculation |
|--------|--------|-------------|
| Skills Match | 40% | (matchedSkills / requiredSkills) × 100 |
| Experience | 25% | min((candidateYears / requiredYears) × 100, 100) |
| Education | 15% | 100 if matches, 50 if related, 25 if unrelated |
| Technical Fit | 20% | Based on technology mastery + projects |

**overallScore = (skills×0.40) + (experience×0.25) + (education×0.15) + (technicalFit×0.20)**

⚠️ CRITICAL INSTRUCTIONS:
1. This is request ${uniqueId}. Analyze ONLY this candidate's data.
2. overallScore MUST vary based on actual calculated metrics.
3. List ALL matched/missing skills (not just 2-3).
4. Be specific in strengths/weaknesses (reference actual CV content).
5. interviewQuestions must address candidate's specific gaps.
6. Do NOT reuse previous analysis patterns.
7. If CV data is incomplete, note it in weaknesses but still analyze.
8. Score must reflect REAL percentage, not generic values (50/60).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 END OF ANALYSIS REQUEST [ID: ${uniqueId}]
`.trim();

  // ===== DIAGNOSTIC LOGS =====
  console.log('📝 [Prompt Gen] Created prompt:', {
    uniqueId,
    length: promptOutput.length,
    yearsOfExperience,
    skillCount,
    certificationsCount,
    projectsCount,
    hasCandidateName: promptOutput.includes(cvData?.personalInfo?.fullName || 'NOT_FOUND')
  });
  // ============================

  return promptOutput;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default createAnalysisPrompt;
