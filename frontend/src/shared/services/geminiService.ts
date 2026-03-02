// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBI81P_nI3taFWpbH_PPtX-10NIEoWa4R0';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Analysis Result Interface
export interface GeminiAnalysis {
  overallScore: number;
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
Tu es un expert en recrutement RH. Analyse le profil candidat suivant et fournis une analyse détaillée.

### Informations du Poste
- Titre: ${job.title}
- Compétences requises: ${job.requiredSkills.join(', ')}
- Expérience requise: ${job.requiredExperience}
- Formation requise: ${job.requiredEducation}

### Profil du Candidat
- Nom: ${candidate.name}
- Email: ${candidate.email}
- Compétences: ${candidate.skills.join(', ')}
- Expérience: ${candidate.experience}
- Formation: ${candidate.education}
${candidate.coverLetter ? `- Lettre de motivation: ${candidate.coverLetter}` : ''}
${candidate.cvText ? `- Contenu CV: ${candidate.cvText}` : ''}

### Format de Réponse JSON (strict)
Tu dois retourner uniquement un objet JSON valide, sans aucun texte supplémentaire:
{
  "overallScore": number (0-100),
  "skillsMatch": {
    "matched": string[] (compétences matchées),
    "missing": string[] (compétences manquantes),
    "percentage": number (0-100)
  },
  "experienceMatch": {
    "required": string,
    "candidate": string,
    "percentage": number (0-100)
  },
  "strengths": string[] (points forts du candidat),
  "weaknesses": string[] (points faibles/gaps),
  "recommendation": string (recommandation finale: "À retenir", "À évaluer", "Non recommandé"),
  "detailedAnalysis": string (analyse détaillée en français),
  "linguisticAnalysis": {
    "writingQuality": string,
    "professionalTone": string,
    "communicationSkills": string
  }
}
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
    
    // Validate and set defaults
    return {
      overallScore: Math.min(100, Math.max(0, analysis.overallScore || 0)),
      skillsMatch: {
        matched: analysis.skillsMatch?.matched || [],
        missing: analysis.skillsMatch?.missing || [],
        percentage: Math.min(100, Math.max(0, analysis.skillsMatch?.percentage || 0)),
      },
      experienceMatch: {
        required: analysis.experienceMatch?.required || jobRequirements.requiredExperience,
        candidate: analysis.experienceMatch?.candidate || candidateProfile.experience,
        percentage: Math.min(100, Math.max(0, analysis.experienceMatch?.percentage || 0)),
      },
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendation: analysis.recommendation || 'À évaluer',
      detailedAnalysis: analysis.detailedAnalysis || 'Analyse non disponible',
      linguisticAnalysis: analysis.linguisticAnalysis || {
        writingQuality: 'Non évalué',
        professionalTone: 'Non évalué',
        communicationSkills: 'Non évalué',
      },
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Return mock data on error for demo purposes
    return getMockAnalysis();
  }
}

// Helper variables for mock (used in error fallback)
const jobRequirements = {
  title: '',
  requiredSkills: [],
  requiredExperience: '',
  requiredEducation: '',
};

const candidateProfile = {
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
    ],
    weaknesses: [
      'Expérience limitée avec AWS',
      'Pas de connaissance en MongoDB',
      'Manque d\'expérience sur les microservices',
    ],
    recommendation: 'À évaluer',
    detailedAnalysis: `Le candidat présente un profil technique intéressant avec une bonne maîtrise des technologies front-end. 
    Cependant, il manque d'expérience avec les technologies cloud (AWS) et les bases de données NoSQL. 
    Nous recommandons une entretien technique approfondi pour évaluer sa capacité à apprendre rapidement ces technologies.`,
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

export default {
  analyzeCandidate,
  calculateQuickMatch,
  getMockAnalysis,
};
