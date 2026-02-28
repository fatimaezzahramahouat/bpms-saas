import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import organisationRouter from "./routes/organisation.routes";
import userManagementRouter from "./routes/userManagement.routes";
import jobOfferRouter from "./routes/jobOffer.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import workflowRouter from "./routes/workflow.routes";
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/organisation", organisationRouter);
app.use("/api/users", userManagementRouter);
app.use("/api/joboffers", jobOfferRouter);
app.use("/api/workflows", workflowRouter);

// Global Error Handler
app.use(errorMiddleware);

export default app;
