import { Router } from "express";
import { userManagementController } from "../controllers/userManagement.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", userManagementController.getUsers);
router.post("/", userManagementController.createUser);
router.patch("/:id", userManagementController.updateUser);
router.delete("/:id", userManagementController.deleteUser);

export default router;
