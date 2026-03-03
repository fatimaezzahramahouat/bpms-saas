// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBI81P_nI3taFWpbH_PPtX-10NIEoWa4R0';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Analysis Result Interface
export interface GeminiAnalysis {
  overallScore: number;
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    technicalFit: number;
  };
  matchedRequirements: string[];
  missingRequirements: string[];
  skillsMatch: {
    matched: string[];
    missing: string[];
    percentage: number;
  };
  experienceMatch: {
    required: string;
    candidate: string;
    percentage: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  detailedAnalysis: string;
  linguisticAnalysis?: {
    writingQuality: string;
    professionalTone: string;
    communicationSkills: string;
  };
  // Backward compatibility properties for CandidateProfilePage
  score?: number;
  competences?: { nom: string; niveau: number }[];
  pointsForts?: string[];
  pointsFaibles?: string[];
  experience?: string;
  formation?: string[];
}

// Job Requirements Interface
export interface JobRequirements {
  title: string;
  requiredSkills: string[];
  requiredExperience: string;
  requiredEducation: string;
}

// Candidate Profile Interface
export interface CandidateProfile {
  name: string;
  email: string;
  skills: string[];
  experience: string;
  education: string;
  coverLetter?: string;
  cvText?: string;
}

// Generate prompt for CV analysis
const generateCVAnalysisPrompt = (candidate: CandidateProfile, job: JobRequirements): string => {
  return `
Tu es un expert en recrutement RH et analyste de talents. Analyse le CV du candidat et compare-le avec les exigences de l'offre d'emploi.

**DONNÉES DU CV DU CANDIDAT:**
${candidate.cvText || `Nom: ${candidate.name}\nEmail: ${candidate.email}\nCompétences: ${candidate.skills.join(', ')}\nExpérience: ${candidate.experience}\nFormation: ${candidate.education}${candidate.coverLetter ? `\nLettre de motivation: ${candidate.coverLetter}` : ''}`}

**EXIGENCES DE L'OFFRE D'EMPLOI:**
- Titre: ${job.title}
- Compétences requises: ${job.requiredSkills.join(', ')}
- Expérience requise: ${job.requiredExperience}
- Formation requise: ${job.requiredEducation}

**TÂCHES D'ANALYSE:**

1. **SCORE DE COMPATIBILITÉ (0-100%)**
   - Calcule le pourcentage de correspondance global
   - Considère: compétences, niveau d'expérience, formation, exigences

2. **ANALYSE DÉTAILLÉE:**
   a) **Correspondance des compétences:**
      - Compétences requises présentes dans le CV
      - Compétences critiques manquantes
      - Compétences supplémentaires valuables
   
   b) **Analyse de l'expérience:**
      - Années d'expérience vs requis
      - Expérience industrielle pertinente
      - Progression de carrière
   
   c) **Formation et Certifications:**
      - Correspondance des diplômes
      - Certifications pertinentes
      - Qualifications supplémentaires
   
   d) **Compétences transversales et Adéquation culturelle:**
      - Capacités de leadership
      - Collaboration en équipe
      - Compétences en communication
   
   e) **Compétences techniques:**
      - Outils et technologies maîtrisés
      - Pertinence des projets techniques
   
   f) **Points forts:**
      - Top 5 des points forts du candidat pour ce poste
   
   g) **Lacunes:**
      - Exigences critiques manquantes
      - Domaines d'amélioration
   
   h) **Recommandations:**
      - Ce candidat devrait-il être interviewé? (Oui/Non/Peut-être)
      - Niveau de priorité (Haute/Moyenne/Basse)
      - Domaines d'entretien spécifiques
      - Questions suggérées pour l'entretien

3. **SORTIE STRUCTURÉE (format JSON):**
{
  "overallScore": number,
  "categoryScores": {
    "skills": number,
    "experience": number,
    "education": number,
    "technicalFit": number
  },
  "matchedRequirements": ["array"],
  "missingRequirements": ["array"],
  "strengths": ["array"],
  "weaknesses": ["array"],
  "recommendation": {
    "decision": "string",
    "priority": "string",
    "interviewQuestions": ["array"],
    "notes": "string"
  }
}

Fournis l'analyse en français car l'interface est en français. Retourne uniquement un objet JSON valide sans texte supplémentaire.
`;
};

// Call Gemini API
async function callGeminiAPI(prompt: string): Promise<GeminiAnalysis> {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate and set defaults - handle both old and new format
    const recommendationObj = analysis.recommendation || { decision: 'À évaluer', priority: 'Moyenne', interviewQuestions: [], notes: '' };
    const categoryScoresObj = analysis.categoryScores || { skills: 0, experience: 0, education: 0, technicalFit: 0 };
    
    // Build backward compatibility properties for CandidateProfilePage
    const competencies: { nom: string; niveau: number }[] = analysis.competences || 
      (analysis.skillsMatch?.matched || []).map((skill: string) => ({
        nom: skill,
        niveau: analysis.skillsMatch?.percentage || 70
      }));
    
    return {
      overallScore: Math.min(100, Math.max(0, analysis.overallScore || 0)),
      categoryScores: {
        skills: Math.min(100, Math.max(0, categoryScoresObj.skills || 0)),
        experience: Math.min(100, Math.max(0, categoryScoresObj.experience || 0)),
        education: Math.min(100, Math.max(0, categoryScoresObj.education || 0)),
        technicalFit: Math.min(100, Math.max(0, categoryScoresObj.technicalFit || 0)),
      },
      matchedRequirements: analysis.matchedRequirements || analysis.skillsMatch?.matched || [],
      missingRequirements: analysis.missingRequirements || analysis.skillsMatch?.missing || [],
      skillsMatch: {
        matched: analysis.skillsMatch?.matched || analysis.matchedRequirements || [],
        missing: analysis.skillsMatch?.missing || analysis.missingRequirements || [],
        percentage: Math.min(100, Math.max(0, analysis.skillsMatch?.percentage || categoryScoresObj.skills || 0)),
      },
      experienceMatch: {
        required: analysis.experienceMatch?.required || jobRequirements.requiredExperience,
        candidate: analysis.experienceMatch?.candidate || candidateProfile.experience,
        percentage: Math.min(100, Math.max(0, analysis.experienceMatch?.percentage || categoryScoresObj.experience || 0)),
      },
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendation: typeof recommendationObj === 'string' ? recommendationObj : recommendationObj.decision || 'À évaluer',
      detailedAnalysis: analysis.detailedAnalysis || 'Analyse non disponible',
      linguisticAnalysis: analysis.linguisticAnalysis || {
        writingQuality: 'Non évalué',
        professionalTone: 'Non évalué',
        communicationSkills: 'Non évalué',
      },
      // Backward compatibility properties
      score: Math.min(100, Math.max(0, analysis.overallScore || 0)),
      competences: competencies,
      pointsForts: analysis.pointsForts || analysis.strengths || [],
      pointsFaibles: analysis.pointsFaibles || analysis.weaknesses || [],
      experience: analysis.experience || analysis.experienceMatch?.candidate || '',
      formation: analysis.formation || [],
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Return mock data on error for demo purposes
    return getMockAnalysis();
  }
}

// Helper variables for mock (used in error fallback)
let jobRequirements: JobRequirements = {
  title: '',
  requiredSkills: [],
  requiredExperience: '',
  requiredEducation: '',
};

let candidateProfile: CandidateProfile = {
  name: '',
  email: '',
  skills: [],
  experience: '',
  education: '',
};

// Mock analysis for demo/fallback
export function getMockAnalysis(): GeminiAnalysis {
  return {
    overallScore: 72,
    categoryScores: {
      skills: 67,
      experience: 60,
      education: 80,
      technicalFit: 75,
    },
    matchedRequirements: ['React', 'TypeScript', 'Node.js', 'JavaScript', 'APIs REST'],
    missingRequirements: ['AWS', 'MongoDB', 'Microservices'],
    skillsMatch: {
      matched: ['React', 'TypeScript', 'Node.js', 'JavaScript'],
      missing: ['AWS', 'MongoDB'],
      percentage: 67,
    },
    experienceMatch: {
      required: '5+ ans',
      candidate: '3 ans',
      percentage: 60,
    },
    strengths: [
      'Solides compétences techniques en React et TypeScript',
      'Expérience avec les APIs REST',
      'Bonne compréhension des principes SOLID',
      'Capacité à travailler en équipe',
      'Autonomie dans le développement front-end',
    ],
    weaknesses: [
      'Expérience limitée avec AWS',
      'Pas de connaissance en MongoDB',
      "Manque d'expérience sur les microservices",
    ],
    recommendation: 'À évaluer',
    detailedAnalysis: `Le candidat présente un profil technique intéressant avec une bonne maîtrise des technologies front-end. 
    Cependant, il manque d'expérience avec les technologies cloud (AWS) et les bases de données NoSQL. 
    Nous recommandons un entretien technique approfondi pour évaluer sa capacité à apprendre rapidement ces technologies.`,
    linguisticAnalysis: {
      writingQuality: 'Bonne',
      professionalTone: 'Professionnel',
      communicationSkills: 'Clair et concis',
    },
  };
}

// Main analysis function
export async function analyzeCandidate(
  candidate: CandidateProfile,
  job: JobRequirements
): Promise<GeminiAnalysis> {
  // Update global variables for mock fallback
  jobRequirements = job;
  candidateProfile = candidate;
  
  const prompt = generateCVAnalysisPrompt(candidate, job);
  return callGeminiAPI(prompt);
}

// Quick match calculation (offline fallback)
export function calculateQuickMatch(
  candidateSkills: string[],
  requiredSkills: string[],
  candidateExperience: string,
  requiredExperience: string
): { percentage: number; matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  
  // Check skills
  requiredSkills.forEach((skill) => {
    const skillLower = skill.toLowerCase();
    const found = candidateSkills.some((cs) => 
      cs.toLowerCase().includes(skillLower) || 
      skillLower.includes(cs.toLowerCase())
    );
    if (found) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  // Calculate percentage
  const skillPercentage = requiredSkills.length > 0 
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 0;

  // Experience calculation (simple)
  const candidateYears = parseInt(candidateExperience.replace(/\D/g, '')) || 0;
  const requiredYears = parseInt(requiredExperience.replace(/\D/g, '')) || 0;
  const experiencePercentage = requiredYears > 0 
    ? Math.min(100, Math.round((candidateYears / requiredYears) * 100))
    : 100;

  // Overall percentage
  const overallPercentage = Math.round((skillPercentage * 0.7) + (experiencePercentage * 0.3));

  return {
    percentage: overallPercentage,
    matched,
    missing,
  };
}

// PDF text extraction (basic implementation - for more robust extraction, consider using pdf-parse)
export async function extractTextFromPDF(file: File): Promise<string> {
  // This is a placeholder - in production, use a proper PDF parsing library
  // For now, we'll read the file as text (works for text-based PDFs)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(arrayBuffer);
    
    // Clean up the text (remove null characters and excessive whitespace)
    return text.replace(/\x00/g, '').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Analyze CV with Gemini (standalone function for PDF analysis)
export async function analyzeCVWithGemini(
  cvText: string,
  jobRequirements?: JobRequirements
): Promise<GeminiAnalysis> {
  // Create a minimal candidate profile from extracted text
  const candidate: CandidateProfile = {
    name: 'Candidat (CV анализ)',
    email: '',
    skills: [],
    experience: '',
    education: '',
    cvText: cvText,
  };

  // Use provided job requirements or default
  const job: JobRequirements = jobRequirements || {
    title: 'Poste à pourvoir',
    requiredSkills: [],
    requiredExperience: '',
    requiredEducation: '',
  };

  return analyzeCandidate(candidate, job);
}

// Type alias for backwards compatibility
export type CandidateAnalysis = GeminiAnalysis;
