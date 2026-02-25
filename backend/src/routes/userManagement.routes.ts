import { Router } from "express";
import { userManagementController } from "../controllers/userManagement.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", userManagementController.getUsers);
router.post("/", userManagementController.createUser);

export default router;
