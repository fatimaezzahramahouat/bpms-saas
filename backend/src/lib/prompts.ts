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
// UNIVERSAL PROMPT FUNCTION - Works with ANY job and ANY CV
// ============================================================================

/**
 * Creates a comprehensive, detailed analysis prompt that works with ANY job offer and ANY candidate CV.
 * This prompt:
 * - Is detailed (2500-3500 chars) to provide comprehensive instructions
 * - Uses proper variable interpolation for ALL dynamic data
 * - Compares CANDIDATE vs JOB OFFER (not candidate vs candidate)
 * - Provides clear matching rules with examples
 * - Outputs consistent JSON format regardless of input
 * - Handles French/English/mixed language CVs and job offers
 * - Is reusable without code changes for new jobs/candidates
 * - Does NOT hardcode specific skills, names, or values
 * - Does NOT include example values that the AI might copy
 */
export function createAnalysisPrompt(cvData: CVData, jobOfferData: JobOfferData): string {
  
  // ✅ VALIDATION: Check for invalid/fallback CV data using new metadata fields
  const rawTextLength = cvData?.rawText?.length || 0;
  const totalSkills = cvData?.technicalSkills ? 
    Object.values(cvData.technicalSkills).flat().length : 0;
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
  
  // Check if this looks like fallback data (very short rawText with only basic skills)
  const isFallbackData = rawTextLength < 200 && totalSkills <= 3 && 
    cvData?.technicalSkills?.backend?.every((s: string) => 
      ['JavaScript', 'Node.js', 'Git'].includes(s)
    );
  
  if (isFallbackData) {
    console.error('❌ [Prompt Gen] REJECTING invalid CV data - appears to be fallback:', {
      name: cvData?.personalInfo?.fullName,
      rawTextLength,
      totalSkills,
      skills: cvData?.technicalSkills?.backend
    });
    throw new Error('Cannot generate prompt: CV data appears to be invalid/fallback. Raw text too short or extraction failed.');
  }
  
  if (rawTextLength < 50) {
    console.error('❌ [Prompt Gen] REJECTING - Raw text too short:', rawTextLength);
    throw new Error('Cannot generate prompt: CV raw text is too short (less than 50 chars)');
  }
  
  // 🔒 SAFE: Extract values with fallbacks (never undefined)
  const name = cvData?.personalInfo?.fullName || 'Candidate';
  const years = cvData?.metadata?.totalYearsExperience || 0;
  const required = Array.isArray(jobOfferData?.requiredSkills) ? jobOfferData.requiredSkills : [];
  
  // ✅ FIX: Add unique request ID to force AI to treat each call as unique
  const uniqueId = `REQ_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  
  // 🔒 SAFE: Extract ALL skills from ALL categories (with null checks)
  const skills: string[] = [];
  
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
            skills.push(skill.trim());
          }
        });
      }
    });
  }
  
  // 🔒 SAFE: Add skills from work experiences
  if (Array.isArray(cvData?.workExperiences)) {
    cvData.workExperiences.forEach(exp => {
      if (Array.isArray(exp?.technologies)) {
        exp.technologies.forEach(tech => {
          if (typeof tech === 'string' && tech.trim()) {
            skills.push(tech.trim());
          }
        });
      }
      if (Array.isArray(exp?.responsibilities)) {
        exp.responsibilities.forEach(resp => {
          if (typeof resp === 'string' && resp.trim()) {
            skills.push(resp.trim());
          }
        });
      }
    });
  }
  
  // 🔒 SAFE: Add technologies with experience
  if (Array.isArray(cvData?.technologiesWithExperience)) {
    cvData.technologiesWithExperience.forEach(tech => {
      if (typeof tech.name === 'string' && tech.name.trim()) {
        skills.push(tech.name.trim());
      }
    });
  }
  
  // 🔒 SAFE: Add skills from achievements
  if (Array.isArray(cvData?.achievements)) {
    cvData.achievements.forEach(ach => {
      if (Array.isArray(ach?.technologies)) {
        ach.technologies.forEach(tech => {
          if (typeof tech === 'string' && tech.trim()) {
            skills.push(tech.trim());
          }
        });
      }
    });
  }
  
  // 🔒 SAFE: Remove duplicates and create display strings
  const uniqueSkills = [...new Set(skills.map(s => s.toLowerCase()))].map(s => 
    skills.find(sk => sk.toLowerCase() === s)
  ).filter(Boolean) as string[];
  
  // ✅ DIAGNOSTIC: Log skills extraction
  console.log('📝 [createAnalysisPrompt] Skills from cvData:', skills?.slice(0, 10));
  console.log('📝 [createAnalysisPrompt] Unique skills count:', uniqueSkills?.length || 0);
  console.log('📝 [createAnalysisPrompt] rawText length:', cvData?.rawText?.length || 0);
  
  // ✅ ENHANCED FALLBACK: If skills are empty, extract from rawText with more keywords
  let finalSkills = uniqueSkills;
  if ((uniqueSkills.length === 0 || uniqueSkills.length < 5) && cvData?.rawText && cvData.rawText.length > 100) {
    console.log('📝 [FALLBACK] Using rawText skill extraction...')
    const raw = cvData.rawText.toLowerCase();
    
    // Expanded keyword list with common tech skills
    const fallbackKeywords = [
      // Frontend
      'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'angular', 'javascript', 'js', 'typescript', 'ts', 
      'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'jquery', 'redux', 'zustand', 'mobx',
      'next.js', 'nextjs', 'nuxt', 'nuxt.js', 'gatsby', 'graphql', 'apollo', 'framer motion',
      // Backend
      'node.js', 'nodejs', 'express', 'express.js', 'python', 'java', 'php', 'laravel', 'symfony',
      'c#', 'csharp', '.net', 'asp.net', 'ruby', 'rails', 'golang', 'go', 'rust', 'scala', 'kotlin',
      'spring', 'django', 'flask', 'fastapi', 'express', 'nestjs', 'nest.js',
      // Databases
      'mysql', 'postgresql', 'postgres', 'mongodb', 'nosql', 'redis', 'elasticsearch', 'sqlite',
      'mariadb', 'oracle', 'mssql', 'dynamodb', 'cassandra', 'firebase', 'supabase',
      // DevOps & Cloud
      'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel',
      'netlify', 'digitalocean', 'jenkins', 'gitlab ci', 'github actions', 'travis ci', 'circleci',
      'nginx', 'apache', 'tomcat', 'linux', 'ubuntu', 'debian', 'centos', 'bash', 'shell',
      'terraform', 'ansible', 'puppet', 'chef', 'vagrant', 'packer',
      // Tools & Other
      'git', 'github', 'gitlab', 'bitbucket', 'svn', 'jira', 'trello', 'slack', 'docker compose',
      'rest api', 'restful', 'graphql', 'websocket', 'grpc', 'tcp/ip', 'http', 'https',
      'agile', 'scrum', 'kanban', 'jira', 'confluence', 'figma', 'photoshop', 'illustrator'
    ];
    
    for (const keyword of fallbackKeywords) {
      if (raw.includes(keyword) && !finalSkills.some(s => s.toLowerCase() === keyword)) {
        finalSkills.push(keyword);
      }
    }
    console.log('📝 [FALLBACK] Extracted skills count:', finalSkills.length);
  }
  
  const skillsDisplay = finalSkills.length > 0 
    ? finalSkills.join(', ') 
    : 'NO_SKILLS_FOUND_IN_CV';
  
  const requiredDisplay = required.length > 0 
    ? required.join(', ') 
    : 'NO_REQUIREMENTS_SPECIFIED';
  
  // ===== DIAGNOSTIC LOGS FOR PROBLEM 1 =====
  console.log('\n📝 ===== PROMPT BUILD DIAGNOSTIC =====');
  console.log('1. Candidate name:', cvData?.personalInfo?.fullName);
  console.log('2. Skills array length:', skills?.length || 0);
  console.log('3. Skills preview:', skills?.slice(0, 10));
  console.log('4. Required skills count:', required?.length || 0);
  console.log('5. Unique skills count:', uniqueSkills?.length || 0);
  console.log('6. skillsDisplay preview:', skillsDisplay?.substring(0, 200));
  // =========================================
  
  // Build comprehensive job context
  const jobContext = `
JOB DETAILS:
- Job Title: ${jobOfferData?.title || 'Not specified'}
- Required Skills: [${requiredDisplay}]
- Experience Required: ${jobOfferData?.experienceRequired || 'Not specified'}
- Education Required: ${jobOfferData?.educationRequired || 'Not specified'}
- Location: ${jobOfferData?.location || 'Not specified'}
- Contract Type: ${jobOfferData?.contractType || 'Not specified'}
- Work Mode: ${jobOfferData?.workMode || 'Not specified'}
`.trim();

  // Build comprehensive candidate context
  const candidateContext = `
CANDIDATE DETAILS:
- Name: ${name}
- Years of Experience: ${years}
- Professional Title: ${cvData?.personalInfo?.professionalTitle || 'Not specified'}
- Summary: ${cvData?.personalInfo?.summary || 'Not specified'}
- Location: ${cvData?.personalInfo?.location || 'Not specified'}
- Email: ${cvData?.personalInfo?.email || 'Not specified'}
`.trim();

  // Build detailed work experience
  let experienceSection = '\nWORK EXPERIENCE:';
  if (cvData?.workExperiences && cvData.workExperiences.length > 0) {
    cvData.workExperiences.forEach((exp, idx) => {
      experienceSection += `\n${idx + 1}. ${exp.title || 'Position'} at ${exp.company || 'Company'} (${exp.period || 'Period not specified'})`;
      if (exp.responsibilities && exp.responsibilities.length > 0) {
        experienceSection += '\n   Responsibilities: ' + exp.responsibilities.join('; ');
      }
      if (exp.technologies && exp.technologies.length > 0) {
        experienceSection += '\n   Technologies: ' + exp.technologies.join(', ');
      }
    });
  } else {
    experienceSection += '\nNo work experience listed.';
  }

  // Build education section
  let educationSection = '\nEDUCATION:';
  if (cvData?.education && cvData.education.length > 0) {
    cvData.education.forEach((edu, idx) => {
      educationSection += `\n${idx + 1}. ${edu.degree || 'Degree'} at ${edu.school || 'School'} (${edu.period || 'Period not specified'})`;
      if (edu.field) educationSection += ` - Field: ${edu.field}`;
    });
  } else {
    educationSection += '\nNo education listed.';
  }

  // Build certifications section
  let certSection = '\nCERTIFICATIONS:';
  if (cvData?.certifications && cvData.certifications.length > 0) {
    cvData.certifications.forEach((cert, idx) => {
      certSection += `\n${idx + 1}. ${cert.name || 'Certification'}${cert.issuer ? ' from ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`;
    });
  } else {
    certSection += '\nNo certifications listed.';
  }

  // Detailed matching rules with examples
  const matchingRules = `
MATCHING RULES - CRITICAL INSTRUCTIONS:
==========================================
1. SKILL MATCHING ALGORITHM:
   - For EACH skill in REQUIRED_SKILLS, search for it in SKILLS_LIST
   - Use case-insensitive matching: "React.js" matches "react", "REACT", "ReactJS", "reactjs"
   - Use fuzzy matching for variations: "SQL" matches "SQL/NoSQL", "PostgreSQL" matches "postgres"
   - Handle partial matches: "Node" matches "Node.js", "NodeJS", "Express" (in Node context)
   - Handle compound skills: "SQL/NoSQL" matches "SQL" OR "NoSQL"
   - Handle technology stacks: "MERN" matches "MongoDB, Express, React, Node"

2. PROOF EXTRACTION:
   - For each matched skill, provide evidence from the CV
   - Evidence can be: job title, responsibility, project, certification, or technology list
   - Format: "SKILL_NAME (evidence from CV)"
   - Example: "React (Used in 2 projects, mentioned in work experience)"

3. SCORE CALCULATION:
   - Calculate: skillMatchScore = (matchedSkillsCount / requiredSkillsCount) * 100
   - If requiredSkillsCount = 0, set score = 0
   - If no skills match, score should be 0 (not empty or null)
   - Always return a valid number between 0-100

4. STRENGTHS IDENTIFICATION:
   - List skills that match AND are above average (proficient/expert level)
   - List relevant certifications
   - List years of experience that meet or exceed requirements
   - List achievements with measurable metrics

5. WEAKNESSES IDENTIFICATION:
   - List required skills that are missing
   - List skills where candidate has only basic/beginner level
   - Note any experience gaps
   - Note education gaps if critical

6. RECOMMENDATION DECISION:
   - "Yes" if score >= 70% AND no critical missing skills
   - "Maybe" if score >= 40% OR missing only 1-2 non-critical skills
   - "No" if score < 40% OR missing critical skills

7. PRIORITY DETERMINATION:
   - "High" if score >= 80%
   - "Medium" if score >= 50%
   - "Low" if score < 50%
`.trim();

  // Build the FULL prompt with ALL dynamic content
  const charCount = cvData?.metadata?.charCount || cvData?.rawText?.length || 0;
  const promptQuality = textQuality || 'Unknown';
  const promptMethod = extractionMethod || 'Unknown';
  
  const promptOutput = `
=== UNIQUE ANALYSIS REQUEST [ID: ${uniqueId}] ===
Timestamp: ${timestamp}
Extraction Method: ${promptMethod}
Text Quality: ${promptQuality}
Character Count: ${charCount}
Candidate: ${name}

=== CANDIDATE VS JOB ANALYSIS TASK ===
Compare the candidate's qualifications against the job requirements.

${candidateContext}

=== SKILLS_LIST (ALL skills found in candidate's CV) ===
[${skillsDisplay}]

${jobContext}

${experienceSection}

${educationSection}

${certSection}

${matchingRules}

=== OUTPUT REQUIREMENTS ===
Return ONLY valid JSON. No other text. Start with { and end with }.

JSON Structure (MUST include all fields):
{
  "overallScore": number (0-100, calculated as percentage of matched required skills),
  "matchedRequirements": ["skill_name (evidence from CV)", ...], // Array of matched skills with proof
  "missingRequirements": ["skill_name", ...], // Array of required skills not found in CV
  "strengths": ["strength description", ...], // Array of candidate's strengths
  "weaknesses": ["weakness description", ...], // Array of candidate's weaknesses  
  "recommendation": {
    "decision": "Yes|No|Maybe", // Based on overall score and missing skills
    "priority": "High|Medium|Low", // Based on how well candidate fits
    "reason": "Brief explanation of the recommendation"
  }
}

IMPORTANT: 
- This is a UNIQUE request with ID: ${uniqueId}
- Do NOT reuse analysis from previous requests
- Always return valid JSON even if CV or job details are incomplete
- If no skills match, overallScore MUST be 0 (not null or undefined)
- If no required skills specified, overallScore MUST be 0
- Include at least empty arrays [] for unmatched fields
- Do not include any explanatory text outside the JSON
`.trim();

  // ===== DIAGNOSTIC LOGS FOR PROMPT LENGTH =====
  console.log('5. Final prompt length:', promptOutput.length, 'chars');
  console.log('6. Prompt includes skills:', promptOutput.includes('SKILLS_LIST') ? 'YES' : 'NO');
  console.log('7. Skills in prompt:', skillsDisplay?.substring(0, 100));
  console.log('8. Total skills found:', finalSkills.length);
  console.log('9. Unique Request ID:', uniqueId);
  console.log('10. Candidate name in prompt:', promptOutput.includes(name) ? 'YES' : 'NO');
  console.log('========================================\n');
  
  // ✅ VALIDATION: Ensure candidate data is properly injected
  if (!promptOutput || promptOutput.length < 200) {
    console.error('❌ [PROMPT ERROR] Generated prompt is too short or empty');
    throw new Error('Prompt generation failed: prompt is too short');
  }
  
  if (!promptOutput.includes(name) || name === 'Candidate') {
    console.warn('⚠️ [PROMPT WARNING] Candidate name not properly injected or using fallback');
  }
  
  if (finalSkills.length === 0) {
    console.warn('⚠️ [PROMPT WARNING] No skills found in CV - analysis may be inaccurate');
  }
  
  return promptOutput;
}

export default createAnalysisPrompt;
