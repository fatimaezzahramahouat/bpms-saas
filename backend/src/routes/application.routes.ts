import { Router } from "express";
import multer from "multer";
import { applicationController } from "../controllers/application.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRH } from "../middleware/role.middleware";

const applicationRouter = Router();

// Configure Multer for memory storage (for Supabase upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// --- PUBLIC ENDPOINTS ---
// POST /api/applications/:jobOfferId/apply
applicationRouter.post("/:jobOfferId/apply", upload.single("cv"), applicationController.applyToJob);

// --- PROTECTED ENDPOINTS (RH/Admin) ---
applicationRouter.use(authMiddleware);

// GET /api/applications/job/:jobOfferId
applicationRouter.get("/job/:jobOfferId", requireRH, applicationController.getApplicationsByJob);

// PATCH /api/applications/:id/status
applicationRouter.patch("/:id/status", requireRH, applicationController.updateStatus);

// DELETE /api/applications/:id
applicationRouter.delete("/:id", requireRH, applicationController.deleteApplication);

export default applicationRouter;
