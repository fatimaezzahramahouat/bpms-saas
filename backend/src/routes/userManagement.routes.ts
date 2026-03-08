import { Router } from "express";
import { userManagementController } from "../controllers/userManagement.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { checkRole } from "../middleware/permission.middleware";

const router = Router();

router.use(authMiddleware);
router.use(checkRole(['ADMIN', 'RH']));

router.get("/", userManagementController.getUsers);
router.post("/", userManagementController.createUser);
router.post("/bulk-import", userManagementController.bulkImport);
router.patch("/:id", userManagementController.updateUser);
router.delete("/:id", userManagementController.deleteUser);

export default router;
