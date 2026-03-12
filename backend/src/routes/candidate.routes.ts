import { Router } from "express";
import multer from "multer";
import { candidateController } from "../controllers/candidate.controller";
import { candidateStatisticsController } from "../controllers/candidateStatistics.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRH } from "../middleware/role.middleware";

const candidateRouter = Router();

// Configure Multer for memory storage (for Supabase upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// --- PUBLIC ENDPOINTS ---
// POST /api/candidates (Self-registration)
candidateRouter.post("/", upload.single("cv"), candidateController.createCandidate);

// --- PROTECTED ENDPOINTS (RH/Admin) ---
candidateRouter.use(authMiddleware);

candidateRouter.get("/statistics", candidateStatisticsController.getStatistics);
candidateRouter.get("/", candidateController.getAllCandidates);
candidateRouter.get("/:id", candidateController.getCandidateById);
candidateRouter.put("/:id", upload.single("cv"), candidateController.updateCandidate);
candidateRouter.patch("/:id/status", candidateController.updateCandidateStatus);
candidateRouter.delete("/:id", candidateController.deleteCandidate);

export default candidateRouter;
