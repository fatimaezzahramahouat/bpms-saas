import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import passport from "passport";
import "./config/passport"; // Import passport configuration

import authRouter from "./routes/auth.routes";
import organisationRouter from "./routes/organisation.routes";
import userManagementRouter from "./routes/userManagement.routes";
import jobOfferRouter from "./routes/jobOffer.routes";
import candidateRouter from "./routes/candidate.routes";
import workflowRouter from "./routes/workflow.routes";
import applicationRouter from "./routes/application.routes";
import taskRouter from "./routes/task.routes";
import processRouter from "./routes/process.routes";
import notificationRouter from "./routes/notification.routes";
import settingsRouter from "./routes/settings.routes";
import analyzeRoutes from "./routes/analyze-candidate";
import bpmsArchitectRouter from "./routes/bpmsArchitect.routes";
import statsRouter from "./routes/stats.routes";

import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Global Logger for Debugging
app.use((req, _res, next) => {
  // console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  // console.log("Headers:", JSON.stringify(req.headers, null, 2));
  // Only log body if it's already parsed (might be empty/missing for multipart)
  next();
});

// Security
// ============================================================================
// Security & Middleware
// ============================================================================

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "connect-src": [
          "'self'",
          "https://pxiqzcbdugmvgpwoagoo.supabase.co",
          "http://localhost:5000",
          "http://localhost:3000",
        ],
        "img-src": ["'self'", "data:", "https://pxiqzcbdugmvgpwoagoo.supabase.co"],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// CORS Configuration — CORS_ORIGINS may be a comma-separated list;
// falls back to FRONTEND_URL (which stays a single URL for redirects/links).
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(cookieParser());
app.use(passport.initialize());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ============================================================================
// API Routes
// ============================================================================

app.use("/api/auth", authRouter);
app.use("/api/organisation", organisationRouter);
app.use("/api/users", userManagementRouter);
app.use("/api/joboffers", jobOfferRouter);
app.use("/api/workflows", workflowRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/candidates", candidateRouter);
app.use("/api/analyze-candidate", analyzeRoutes);
app.use("/api/tasks", taskRouter);
app.use("/api/process", processRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/generate-bpms", bpmsArchitectRouter);
app.use("/api/stats", statsRouter);

// ============================================================================
// Health Check & Root
// ============================================================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "NexFlow API running 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 404 & Error Handling
// ============================================================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;