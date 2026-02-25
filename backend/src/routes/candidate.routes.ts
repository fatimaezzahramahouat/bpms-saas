import { Router } from "express";
import { candidateController } from "../controllers/candidate.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const candidateRouter = Router();

// Toutes les routes sont protégées par authMiddleware pour garantir la multi-ténance
candidateRouter.get("/", authMiddleware, candidateController.getCandidates);
candidateRouter.post("/", authMiddleware, candidateController.createCandidate);
candidateRouter.patch("/:id/status", authMiddleware, candidateController.updateCandidateStatus);
candidateRouter.delete("/:id", authMiddleware, candidateController.deleteCandidate);

export default candidateRouter;
