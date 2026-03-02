import { Router } from "express";
import { jobOfferController } from "../controllers/jobOffer.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRH } from "../middleware/role.middleware";

const jobOfferRouter = Router();

// --- RH DASHBOARD ENDPOINTS ---
// Protected by Auth and RH Role
jobOfferRouter.use("/rh", authMiddleware, requireRH);

jobOfferRouter.get("/rh", jobOfferController.getRHOffers);
jobOfferRouter.post("/rh", jobOfferController.createOffer);
jobOfferRouter.put("/rh/:id", jobOfferController.updateOffer);
jobOfferRouter.delete("/rh/:id", jobOfferController.deleteOffer);
jobOfferRouter.get("/rh/:id/candidates", jobOfferController.getCandidates);

// --- PUBLIC ENDPOINTS ---
// GET /api/joboffers (Pagination, search, filters)
jobOfferRouter.get("/", jobOfferController.getPublicOffers);
jobOfferRouter.get("/:id", jobOfferController.getOfferById);

export default jobOfferRouter;
