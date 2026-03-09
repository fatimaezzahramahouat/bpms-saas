// /home/manal/projet_final_BPMS/backend/src/lib/prompts.ts



// ============================================================================
// INTERFACES - تعريف الواجهات
// ============================================================================

// ✅ واجهة JobOfferData (مطلوبة للدالة)
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

// ✅ واجهة CVData متوافقة مع cvExtractor.ts الجديد
export interface CVData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
    professionalTitle?: string;
    summary?: string;
  };
  workExperiences: Array<{
    title: string;
    company: string;
    period: string;
    location: string;
    responsibilities: string[];
    technologies?: string[];
    achievements?: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    period: string;
    location: string;
    field?: string;
  }>;
  technicalSkills: {
    frontend: string[];
    backend: string[];
    databases: string[];
    devops: string[];
    security: string[];
    cms: string[];
    tools: string[];
    automation: string[];
    methodologies: string[];
    testing: string[];
  };
  achievements: Array<{
    category: 'development' | 'automation' | 'optimization' | 'database' | 'security' | 'ecommerce';
    description: string;
    metrics?: {
      value: string;
      type: 'products' | 'leads' | 'performance' | 'reduction' | 'time' | 'other';
    };
    technologies?: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    results?: string;
    link?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
    date?: string;
    expiry?: string;
  }>;
  languages: Array<{
    language: string;
    level: 'débutant' | 'fonctionnel' | 'courant' | 'natif' | 'intermédiaire';
    details?: string;
  }>;
  interests: string[];
  rawText: string;
  technologiesWithExperience?: Array<{
    name: string;
    category: string;
    context: 'production' | 'personal' | 'learning';
    yearsOfUse?: number;
    lastUsed?: string;
    proficiency?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  }>;
  softSkills?: Array<{
    name: string;
    evidence: string[];
    confidence: 'high' | 'medium' | 'low';
  }>;
  publicLinks?: Array<{
    type: 'github' | 'gitlab' | 'portfolio' | 'linkedin' | 'blog' | 'other';
    url: string;
    description?: string;
  }>;
  publicProjects?: Array<{
    name: string;
    url?: string;
    technologies: string[];
    description?: string;
    isPersonal: boolean;
  }>;
  metadata?: {
    extractionDate: string;
    totalYearsExperience: number;
    expertiseLevel: string;
    technologiesCount: number;
  };
}

// ============================================================================
// MAIN FUNCTION - الدالة الرئيسية
// ============================================================================

/**
 * Creates a detailed analysis prompt for AI to compare CV with Job Offer
 */
export function createAnalysisPrompt(cvData: CVData, jobOfferData: JobOfferData): string {
  return `
Tu es un expert RH effectuant une analyse PRÉCISE et DIFFÉRENCIÉE d'un CV RÉEL.

⚠️ **AVERTISSEMENT CRITIQUE:**
- Tu DOIS lire ATTENTIVEMENT chaque ligne du CV ci-dessous
- Tu DOIS extraire les détails SPÉCIFIQUES: années, niveaux, noms de projets, certifications
- Tu NE DOIS PAS donner de réponses génériques - chaque candidat est UNIQUE
- Tu DOIS vérifier CHAQUE affirmation dans le CV réel
- Si une compétence n'est pas mentionnée, tu DOIS la marquer comme manquante
- Tu DOIS noter les réalisations chiffrées (ex: "300+ produits", "95+ Core Web Vitals")

================================================================================
**CV COMPLET DU CANDIDAT - À LIRE ATTENTIVEMENT:**
================================================================================

**👤 INFORMATIONS PERSONNELLES:**
• Nom: ${cvData.personalInfo?.fullName || 'Non spécifié'}
• Email: ${cvData.personalInfo?.email || 'Non spécifié'}
• Téléphone: ${cvData.personalInfo?.phone || 'Non spécifié'}
• Localisation: ${cvData.personalInfo?.location || 'Non spécifié'}
• LinkedIn: ${cvData.personalInfo?.linkedin || 'Non spécifié'}
• Site Web: ${cvData.personalInfo?.website || 'Non spécifié'}
• Titre Professionnel: ${cvData.personalInfo?.professionalTitle || 'Non spécifié'}
• Résumé: ${cvData.personalInfo?.summary || 'Non spécifié'}

**💼 EXPÉRIENCES PROFESSIONNELLES:**
${cvData.workExperiences?.map(exp => `
→ ${exp.title} chez ${exp.company} (${exp.period}, ${exp.location})
  Responsabilités:
  ${exp.responsibilities.map(resp => `  • ${resp}`).join('\n')}
  Technologies: ${exp.technologies?.join(', ') || 'Non spécifié'}
`).join('\n') || 'Non spécifié'}

**🎓 FORMATION:**
${cvData.education?.map(edu => `
→ ${edu.degree} - ${edu.school} (${edu.period}, ${edu.location})
  Domaine: ${edu.field || 'Non spécifié'}
`).join('\n') || 'Non spécifié'}

**🛠️ COMPÉTENCES TECHNIQUES (CATÉGORISÉES):**
• Frontend: ${cvData.technicalSkills?.frontend?.join(', ') || 'Aucune'}
• Backend: ${cvData.technicalSkills?.backend?.join(', ') || 'Aucune'}
• Bases de données: ${cvData.technicalSkills?.databases?.join(', ') || 'Aucune'}
• DevOps: ${cvData.technicalSkills?.devops?.join(', ') || 'Aucune'}
• Sécurité: ${cvData.technicalSkills?.security?.join(', ') || 'Non spécifié'}
• CMS/E-commerce: ${cvData.technicalSkills?.cms?.join(', ') || 'Aucune'}
• Outils: ${cvData.technicalSkills?.tools?.join(', ') || 'Aucune'}
• Automatisation: ${cvData.technicalSkills?.automation?.join(', ') || 'Aucune'}
• Méthodologies: ${cvData.technicalSkills?.methodologies?.join(', ') || 'Non spécifié'}
• Testing: ${cvData.technicalSkills?.testing?.join(', ') || 'Non spécifié'}

**🏆 RÉALISATIONS AVEC MÉTRIQUES:**
${cvData.achievements?.map(ach => `
→ [${ach.category.toUpperCase()}] ${ach.description}
  ${ach.metrics ? `📊 Métrique: ${ach.metrics.value} (${ach.metrics.type})` : ''}
  ${ach.technologies?.length ? `🔧 Technologies: ${ach.technologies.join(', ')}` : ''}
`).join('\n') || 'Non spécifié'}

**📁 PROJETS:**
${cvData.projects?.map(proj => `
→ ${proj.name}: ${proj.description}
  Technologies: ${proj.technologies?.join(', ') || 'Non spécifié'}
  Résultats: ${proj.results || 'Non spécifié'}
  ${proj.link ? `🔗 Lien: ${proj.link}` : ''}
`).join('\n') || 'Non spécifié'}

**📜 CERTIFICATIONS:**
${cvData.certifications?.map(cert => 
  `• ${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}`
).join('\n') || 'Non spécifié'}

**🌍 LANGUES:**
${cvData.languages?.map(lang => 
  `• ${lang.language}: ${lang.level}${lang.details ? ` (${lang.details})` : ''}`
).join('\n') || 'Non spécifié'}

**🎯 CENTRES D'INTÉRÊT:**
${cvData.interests?.join(' • ') || 'Non spécifié'}

**🔗 LIENS PUBLICS:**
${cvData.publicLinks?.map(link => `• ${link.type}: ${link.url}`).join('\n') || 'Non spécifié'}

**💡 COMPÉTENCES PERSONNELLES (SOFT SKILLS):**
${cvData.softSkills?.map(ss => `• ${ss.name} [${ss.confidence}]`).join('\n') || 'Non spécifié'}

**📊 MÉTADONNÉES:**
• Années d'expérience: ${cvData.metadata?.totalYearsExperience || 'Non spécifié'}
• Niveau d'expertise: ${cvData.metadata?.expertiseLevel || 'Non spécifié'}
• Nombre de technologies: ${cvData.metadata?.technologiesCount || 'Non spécifié'}

================================================================================
**OFFRE D'EMPLOI:**
================================================================================
Poste: ${jobOfferData.title || 'Non spécifié'}
Entreprise: ${jobOfferData.company || 'Non spécifié'}
Compétences Requises: ${Array.isArray(jobOfferData.requiredSkills) ? jobOfferData.requiredSkills.join(', ') : 'Non spécifié'}
Expérience Requise: ${jobOfferData.experienceRequired || 'Non spécifié'}
Formation Requise: ${jobOfferData.educationRequired || 'Non spécifié'}
Responsabilités: ${Array.isArray(jobOfferData.responsibilities) ? jobOfferData.responsibilities.join('\n') : 'Non spécifié'}
Localisation: ${jobOfferData.location || 'Non spécifié'}
Type de contrat: ${jobOfferData.contractType || 'Non spécifié'}
Mode de travail: ${jobOfferData.workMode || 'Non spécifié'}

================================================================================
**TA MISSION - ÉTAPES OBLIGATOIRES:**
================================================================================

**ÉTAPE 1: EXTRAIRE LES PREUVES DU CV**
Pour CHAQUE exigence de l'offre:
- ✅ Cite les phrases EXACTES du CV (section, ligne, contexte)
- ✅ Mentionne les années d'expérience spécifiques trouvées
- ✅ Mentionne les projets concrets avec résultats chiffrés
- ✅ Mentionne les certifications avec dates si disponibles
- ❌ N'invente RIEN - utilise uniquement ce qui est écrit dans le CV
- ❌ Si une compétence n'est pas dans le CV → marque-la comme manquante

**ÉTAPE 2: COMPARAISON PRÉCISE DES COMPÉTENCES**
Pour CHAQUE compétence requise:
- Vérifie si elle apparaît dans cvData.technicalSkills ou workExperiences
- Note le niveau mentionné (junior/mid/senior/expert/notions)
- Note les années d'expérience associées
- Note le contexte: production vs projet personnel vs apprentissage
- Exemple BON: "Node.js: OUI - mentionné dans expérience ON MY WEB MAROC (2024-2025), utilisé pour systèmes d'authentification"
- Exemple MAUVAIS: "Node.js" (trop vague)

**ÉTAPE 3: POINTS BONUS - Valeur Ajoutée**
Identifie les compétences/expériences NON requises mais précieuses:
- 🎯 Leadership: lead dev, mentoring, gestion d'équipe
- 🎯 Certifications: AWS, Azure, PMP, Scrum, etc.
- 🎯 Contributions open source (GitHub/GitLab links)
- 🎯 Conférences/Meetups/Articles techniques
- 🎯 Diplômes avancés (Master, PhD, MBA)
- 🎯 Langues supplémentaires avec niveaux
- 🎯 Expertise domaine: fintech, santé, e-commerce, etc.
- 🎯 Automatisations: n8n, Zapier, workflows complexes
- 🎯 Optimisations: Core Web Vitals, SEO, performance metrics
- 🎯 Résultats chiffrés: "300+ produits", "200+ leads", "45→95+", "90% réduction"

**ÉTAPE 4: CALCUL MATHÉMATIQUE PRÉCIS**
- Compte les exigences requises correspondantes (exact match ou partial)
- Compte les exigences manquantes (non mentionnées dans le CV)
- overallScore = (correspondances / total_exigences) × 100
- Utilise la précision DÉCIMALE: 66.67, 78.45, 82.30 (PAS 67, 78, 82)
- Réduis le score si années d'expérience < requis: -10 points par année manquante
- Augmente le score pour bonus points: +3 points par bonus significatif
- Pondère les compétences critiques: x1.5 pour les skills "required" vs "preferred"

**ÉTAPE 5: SOIS HONNÊTE SUR LES ÉCARTS**
- Si candidat a 4 ans vs 5+ requis → mentionne l'écart: "1 année d'expérience manquante"
- Si compétence mentionnée mais niveau "notions" → marque comme "partial" avec raison
- Si certification expirée ou en cours → mentionne-le dans weaknesses
- Si technologie similaire mais pas exacte → note la différence: "JavaScript ≠ TypeScript"

================================================================================
**FORMAT DE SORTIE - JSON VALIDE UNIQUEMENT:**
================================================================================
⚠️ CALCULATION RULES (FOLLOW EXACTLY):
1. overallScore = (matched_skills / total_required_skills) × 100
   Example: If job requires 6 skills and candidate has 4 → (4/6)×100 = 66.67
2. categoryScores must be calculated separately:
   - skills: % of required technical skills found in CV
   - experience: (candidate_years / required_years) × 100, capped at 100
   - education: 100 if matches requirement, 50 if lower degree, 0 if none
   - technicalFit: weighted average of skills + experience scores
3. Use EXACT 2 decimals: 66.67 NOT 67, 72.50 NOT 72
4. If a skill is NOT in cvData.technicalSkills or workExperiences → mark as missing
5. DO NOT invent skills or scores - use ONLY data from CV above


// ⚠️ IMPORTANT: Generate UNIQUE analysis based on the CV data provided above.
// Do NOT copy examples - every candidate is DIFFERENT.
{
  "overallScore": CALCULATED_SCORE_WITH_2_DECIMALS,
  
  "categoryScores": {
    "skills": CALCULATED_FROM_CV_DATA,
    "experience": CALCULATED_FROM_CV_DATA,
    "education": CALCULATED_FROM_CV_DATA,
    "technicalFit": CALCULATED_FROM_CV_DATA
  },

  "matchedRequirements": [
    "LIST each matched skill from the CV with specific evidence from the CV sections above"
  ],
  
  "missingRequirements": [
    "LIST each required skill NOT found in the CV"
  ],
  
  "bonusPoints": [
    "LIST any extra skills/experience from the CV that are valuable but not required"
  ],
  
  "strengths": [
    "LIST specific strengths from this candidate's CV"
  ],
  
  "weaknesses": [
    "LIST specific weaknesses or gaps for this candidate"
  ],
  
  "criticalGaps": [
    "LIST critical missing requirements for this position"
  ],
  
  "recommendation": {
    "decision": "Strong Yes|Yes|Maybe|No",
    "priority": "High|Medium|Low",
    "interviewQuestions": [
      "Generate 3-5 specific questions based on this candidate's actual CV content"
    ],
    "notes": "Provide detailed analysis based on THIS candidate's specific CV"
  }
}


================================================================================
**RÈGLES CRITIQUES - À SUIVRE STRICTEMENT:**
================================================================================


1. ✅ **CITE LE CV EXPLICITEMENT**: Chaque affirmation doit référencer un contenu spécifique
   - BIEN: "Node.js (mentionné dans expérience ON MY WEB MAROC, section responsabilités)"
   - MAL: "Node.js" (trop vague, pas de preuve)

2. ✅ **MENTIONNE ANNÉES & NIVEAUX**: Toujours spécifier le contexte temporel
   - BIEN: "4 ans d'expérience (2021-2025), niveau avancé sur Node.js"
   - MAL: "Expérience en développement" (pas de détails)

3. ✅ **CHERCHE LES BONUS ACTIVEMENT**: Identifie la valeur ajoutée au-delà des requis
   - Automatisations n8n, optimisations Core Web Vitals, résultats chiffrés, langues multiples, liens GitHub/Portfolio

4. ✅ **SOIS MATHÉMATIQUEMENT PRÉCIS**:
   - 4 correspondances sur 6 exigences = 66.67% (PAS 67%, PAS 70%)
   - Utilise 2 décimales minimum: 73.45, 82.30, 66.67
   - Arrondis correctement: Math.round(value * 100) / 100

5. ✅ **PÉNALISE EXPÉRIENCE INSUFFISANTE**:
   - Candidat a 4 ans, besoin 5+ → réduit experienceScore de 10-15 points
   - Mentionne l'écart explicitement dans criticalGaps

6. ✅ **VÉRIFIE CHAQUE COMPÉTENCE INDIVIDUELLEMENT**:
   - Si pas dans technicalSkills ou workExperiences → manquante
   - Si similaire mais pas exact → note la différence: "JavaScript ≠ TypeScript"
   - Si mentionné comme "notions" ou "bases" → marque comme partial avec raison

7. ✅ **NOTE LES RÉSULTATS CHIFFRÉS COMME BONUS MAJEURS**:
   - "300+ produits", "200+ leads", "45→95+", "90% réduction" = +5 points chacun
   - Ces métriques concrètes augmentent significativement le score

8. ✅ **LANGUE FRANÇAISE OBLIGATOIRE**: Tout le texte de l'analyse en français
9. ✅ **JSON VALIDE UNIQUEMENT**: Pas de markdown, pas de commentaires, pas de texte avant/après le JSON

================================================================================

Maintenant analyse CE candidat spécifique (données structurées ci-dessus) contre CETTE offre spécifique.
Sortie UNIQUEMENT un objet JSON valide, aucun autre texte, aucun markdown, aucune explication avant ou après.
Commence directement par { et termine par }.

⚠️ CRITICAL: You MUST calculate actual values using the formula:
overallScore = (matched_skills / total_required_skills) × 100
Use ONLY data from the CV sections above - DO NOT copy any example values

`;


}

export default createAnalysisPrompt;