import Groq from "groq-sdk";
import prisma from "../lib/prisma";

const AI_KEY = process.env.GROQ_API_KEY || "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";

export const aiAuditService = {
    /**
     * Performs an intelligent AI analysis of a process instance's context and history.
     */
    async analyzeInstance(instanceId: string, customPrompt: string): Promise<any> {
        try {
            console.log(`[AIAuditService] Starting analysis for instance ${instanceId}`);

            const instance = await prisma.processInstance.findUnique({
                where: { id: instanceId },
                include: {
                    workflow: true,
                    user: true,
                    tasks: {
                        include: { user: true }
                    }
                }
            });

            if (!instance) return null;

            const groq = new Groq({ apiKey: AI_KEY });

            const systemPrompt = `Tu es l'Expert Audit AI de Nexflow. Ta mission est d'analyser les données d'un processus métier (BPMS) pour détecter des anomalies, évaluer les risques et donner des recommandations stratégiques.
            
            Tu dois retourner un JSON avec cette structure exacte :
            {
                "overallScore": number (0-100),
                "riskLevel": "LOW" | "MEDIUM" | "HIGH",
                "fraudDetection": string (description courte),
                "recommendation": string,
                "strengths": string[],
                "weaknesses": string[]
            }
            
            IMPORTANT : Ne réponds qu'avec le JSON.`;

            const userPrompt = `
            Analyse cette demande : ${instance.workflow.name}
            Détails de la demande (Context JSON) : ${JSON.stringify(instance.context)}
            Initiateur : ${instance.user?.firstName} ${instance.user?.lastName} (${instance.user?.email})
            Nombre d'étapes validées : ${instance.tasks.length}
            
            Instructions spécifiques : ${customPrompt}
            `;

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            const content = chatCompletion.choices[0]?.message?.content || "{}";
            const analysisResult = JSON.parse(content);

            // Save to database
            const savedAnalysis = await prisma.aIAnalysis.create({
                data: {
                    type: "WORKFLOW_AUDIT",
                    processInstanceId: instanceId,
                    result: analysisResult,
                    overallScore: analysisResult.overallScore || 0,
                    recommendation: analysisResult.recommendation,
                    strengths: analysisResult.strengths || [],
                    weaknesses: analysisResult.weaknesses || [],
                    confidence: analysisResult.overallScore / 100
                }
            });

            // Log activity
            await prisma.eventLog.create({
                data: {
                    action: `AI_AUDIT_COMPLETED: Risk ${analysisResult.riskLevel}`,
                    processInstanceId: instanceId,
                    userId: null
                }
            });

            return savedAnalysis;
        } catch (error) {
            console.error("[AIAuditService] Error during AI analysis:", error);
            return null;
        }
    }
};
