import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { processController } from "../controllers/process.controller";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const processRouter = Router();

processRouter.use(authMiddleware);

processRouter.post("/start", upload.single("document"), processController.startProcess);
processRouter.get("/my-requests", processController.getMyRequests);

export default processRouter;
