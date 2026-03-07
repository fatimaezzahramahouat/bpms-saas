import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { z } from "zod";
import Groq from "groq-sdk";

const generateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sector: z.string().min(1, "Sector is required"),
    rules: z.string().min(1, "Rules are required"),
});

export const bpmsArchitectController = {
    async generateBpms(req: AuthRequest, res: Response): Promise<void> {
        try {
            const parsed = generateSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
                return;
            }

            const { name, sector, rules } = parsed.data;

            const systemPrompt = `Tu es l'Architecte BPMS de DilWeb Agency. Ta mission est de générer UNIQUEMENT un objet JSON structuré pour un Workflow Builder.
L'utilisateur te donnera : [Nom du Processus, Secteur, Règles].

Tu dois retourner un JSON avec cette structure exacte :
{
  "metadata": { "name": "Nom", "sector": "Secteur", "version": "1.0" },
  "nodes": [
    { "id": "1", "label": "Etape 1", "type": "start", "role": "Acteur" },
    { "id": "2", "label": "Etape 2", "type": "task", "role": "Acteur" }
  ],
  "edges": [
    { "source": "1", "target": "2", "condition": "Si valide" }
  ],
  "data_model": [
    { "name": "Champ1", "type": "text", "required": true }
  ],
  "business_rules": ["Règle 1", "Règle 2"]
}

IMPORTANT : Ne réponds avec aucun texte avant ou après le JSON. Retourne uniquement le code JSON.`;

            const userPrompt = `Génère le workflow pour : ${name} dans le secteur ${sector}. Règles : ${rules}`;

            const aiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_KEY || "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";
            if (!aiKey) {
                throw new Error("AI API Key is missing from environment variables.");
            }

            const groq = new Groq({ apiKey: aiKey });

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "llama-3.3-70b-versatile", // Hada houwa l-jadid li khdaw f blasst dak li t-decommissionner
                temperature: 0.1, // Bach y-koun d9i9 o may-khrbjch
                response_format: { type: "json_object" } // Enforce valid JSON structure
            });

            const content = chatCompletion.choices[0]?.message?.content || "{}";

            try {
                // Due to json_object, the content should be clean JSON
                const workflowJSON = JSON.parse(content);
                res.status(200).json(workflowJSON);
            } catch (parseError) {
                console.error("Failed to parse AI response as JSON:", content, parseError);
                res.status(500).json({ error: "AI returned invalid JSON format." });
            }

        } catch (error: any) {
            console.error("Erreur de génération BPMS:", error);
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
};
