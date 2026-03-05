
// Types
interface CVData {
  name?: string | undefined;
  skills?: string[] | undefined;
  experience?: string | undefined;
  education?: string | undefined;
  projects?: string[] | undefined;
  languages?: string[] | undefined;
  [key: string]: unknown;
}

interface JobOfferData {
  title?: string | undefined;
  company?: string | undefined;
  requiredSkills?: string[] | undefined;
  experienceRequired?: string | undefined;
  educationRequired?: string | undefined;
  responsibilities?: string[] | undefined;
  location?: string | undefined;
  salary?: string | undefined;
  [key: string]: unknown;
}

/**
 * @param cvData - 
 * @param jobOfferData 
 * @returns string 
 */
export function createAnalysisPrompt(cvData: CVData, jobOfferData: JobOfferData): string {
  return `
You are an expert HR recruiter and professional CV analyst.
Your task: Analyze the candidate's CV and compare it with the Job Offer requirements.

=====================================
**Candidate CV Data:**
${JSON.stringify(cvData, null, 2)}

**Job Offer Requirements:**
${JSON.stringify(jobOfferData, null, 2)}
=====================================

**Required Analysis:**

1. **Calculate Overall Compatibility Score (0-100%)**
2. **Detailed Analysis for Each Category:** (Skills, Experience, Education, Technical Fit)
3. **Identify:** Matched Requirements, Missing Requirements, Strengths, Weaknesses
4. **Provide Recommendation:** Decision, Priority, Interview Questions

=====================================
**Output must be valid JSON only (no markdown, no extra text):**

{
  "overallScore": 82,
  "categoryScores": {
    "skills": 85,
    "experience": 78,
    "education": 80,
    "technicalFit": 84
  },
  "matchedRequirements": ["React", "Node.js", "TypeScript"],
  "missingRequirements": ["MongoDB", "Docker"],
  "strengths": [
    "Expérience solide en développement React",
    "Maîtrise des bonnes pratiques TypeScript",
    "Capacité à travailler en équipe Agile",
    "Projets personnels démontrant l'autonomie"
  ],
  "weaknesses": [
    "Expérience limitée avec les bases de données NoSQL",
    "Aucune mention de conteneurisation (Docker/K8s)"
  ],
  "recommendation": {
    "decision": "Yes",
    "priority": "High",
    "interviewQuestions": [
      "Pouvez-vous décrire l'architecture d'un projet React complexe?",
      "Comment gérez-vous la performance dans vos applications?",
      "Quelle est votre expérience avec les tests automatisés?",
      "Comment abordez-vous l'apprentissage d'une nouvelle technologie?"
    ],
    "notes": "Candidat très prometteur. Les compétences manquantes peuvent être acquises rapidement."
  }
}
=====================================
⚠️ IMPORTANT:
- Respond in FRENCH language only
- Output MUST be valid parseable JSON
- NO markdown formatting (no \`\`\`json)
- NO extra text before or after JSON
`;
}

export default createAnalysisPrompt;