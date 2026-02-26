import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";

export const candidateController = {
    async getCandidates(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organisationId = req.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Non autorisé" });
                return;
            }

            const candidates = await prisma.candidate.findMany({
                where: { organisationId },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json({ data: candidates });
        } catch (error: any) {
            console.error("GET_CANDIDATES_ERROR:", error);
            res.status(500).json({ error: "Erreur lors de la récupération des candidats" });
        }
    },

    async createCandidate(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organisationId = req.user?.organisationId;
            if (!organisationId) {
                res.status(401).json({ error: "Non autorisé" });
                return;
            }

            const { email, fullName, phone, cv } = req.body;

            if (!email || !fullName) {
                res.status(400).json({ error: "Email et nom complet sont requis" });
                return;
            }

            const candidate = await prisma.candidate.create({
                data: {
                    email,
                    fullName,
                    phone,
                    cv,
                    organisationId
                }
            });

            res.status(201).json({ data: candidate });
        } catch (error: any) {
            if (error.code === "P2002") {
                res.status(409).json({ error: "Un candidat avec cet email existe déjà" });
                return;
            }
            console.error("CREATE_CANDIDATE_ERROR:", error);
            res.status(500).json({ error: "Erreur lors de la création du candidat" });
        }
    },

    async updateCandidateStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const organisationId = req.user?.organisationId;

            if (!organisationId) {
                res.status(401).json({ error: "Non autorisé" });
                return;
            }

            const candidate = await prisma.candidate.update({
                where: { id, organisationId },
                data: { status }
            });

            res.status(200).json({ data: candidate });
        } catch (error: any) {
            console.error("UPDATE_CANDIDATE_ERROR:", error);
            res.status(500).json({ error: "Erreur lors de la mise à jour du candidat" });
        }
    },

    async deleteCandidate(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organisationId = req.user?.organisationId;

            if (!organisationId) {
                res.status(401).json({ error: "Non autorisé" });
                return;
            }

            await prisma.candidate.delete({
                where: { id, organisationId }
            });

            res.status(204).send();
        } catch (error: any) {
            console.error("DELETE_CANDIDATE_ERROR:", error);
            res.status(500).json({ error: "Erreur lors de la suppression du candidat" });
        }
    }
};
