import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes";
import organisationRouter from "./routes/organisation.routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
// Routes

app.use("/api/auth", authRouter);
app.use("/api/organisation", organisationRouter);

export default app;
