import { Router } from "express";
import { jobOfferController } from "../controllers/jobOffer.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRH } from "../middleware/role.middleware";

const jobOfferRouter = Router();

// ---- RH PROTECTED ENDPOINTS ----
// All /rh routes require authenticated RH user
jobOfferRouter.use("/rh", authMiddleware, requireRH);

jobOfferRouter.get("/rh", jobOfferController.getRHOffers);
jobOfferRouter.post("/rh", jobOfferController.createOffer);
jobOfferRouter.put("/rh/:id", jobOfferController.updateOffer);
jobOfferRouter.delete("/rh/:id", jobOfferController.deleteOffer);
jobOfferRouter.get("/rh/:id/candidates", jobOfferController.getCandidates);

// ---- SYSTEM AUTOMATION ENDPOINTS ----
// These should ideally be protected by an internal API key or system middleware.
// For now they are protected by authMiddleware only (tighten as needed).
jobOfferRouter.use("/system", authMiddleware);
jobOfferRouter.patch("/system/:id/fill", jobOfferController.markAsFilled);
jobOfferRouter.patch("/system/:id/close", jobOfferController.markAsClosed);

// ---- PUBLIC ENDPOINTS ----
// GET /api/joboffers (search with pagination)
jobOfferRouter.get("/", jobOfferController.getPublicOffers);
jobOfferRouter.get("/:id", jobOfferController.getOfferById);

export default jobOfferRouter;
