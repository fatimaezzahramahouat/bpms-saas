import { Router } from "express";
import { bpmsArchitectController } from "../controllers/bpmsArchitect.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { checkRole } from "../middleware/permission.middleware";

const router = Router();

router.use(authMiddleware);
router.use(checkRole(['ADMIN'])); // Ensures only Admins can access this feature

router.post("/", bpmsArchitectController.generateBpms);

export default router;
