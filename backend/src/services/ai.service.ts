import prisma from "../lib/prisma";

export const aiService = {
    /**
     * Generates a candidate analysis (AI Insight) for an application.
     * This uses a mock implementation but is structured for OpenAI integration.
     */
    async generateCandidateAnalysis(applicationId: string) {
        // 1. Fetch Application data with Candidate and JobOffer
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                candidate: true,
                jobOffer: true,
                processInstance: true
            }
        });

        if (!application || !application.processInstance) {
            console.error(`Application ${applicationId} not found or missing process instance.`);
            return;
        }

        console.log(`[AI Service] Generating analysis for candidate: ${application.candidate.fullName}`);

        /**
         * NOTE: To use real OpenAI API:
         * 1. npm install openai
         * 2. Use the OpenAI client with prompt: 
         *    "Analyze this candidate for the position '${application.jobOffer.title}'. 
         *    Candidate info: ${JSON.stringify(application.candidate)}. 
         *    Return a JSON with matchingScore (0-100) and summary (4 bullet points max)."
         */

        // MOCK LOGIC (simulating AI findings)
        const mockAnalysis = {
            matchingScore: Math.floor(Math.random() * (95 - 65 + 1)) + 65, // Random score between 65 and 95
            summary: [
                `Solide expérience technique en ${application.jobOffer.title.includes('React') ? 'React/Frontend' : 'Backend'}.`,
                "Bonne adéquation avec les valeurs de l'entreprise.",
                "Profil proactif avec des expériences en autonomie.",
                "Mention spéciale pour la clarté du CV."
            ],
            weaknesses: [
                "Niveau d'anglais technique à confirmer en entretien.",
                "Peu d'expérience sur les architectures cloud complexes."
            ]
        };

        // 2. Store in AIAnalysis table
        await prisma.aIAnalysis.create({
            data: {
                type: "CANDIDATE_MATCHING",
                result: mockAnalysis,
                confidence: 0.88,
                applicationId: application.id,
                processInstanceId: application.processInstance.id
            }
        });

        console.log(`[AI Service] Analysis stored for ${application.candidate.fullName}`);
    }
};
