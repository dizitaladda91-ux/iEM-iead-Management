import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import morgan from "morgan";

import validateEnv from "./config/env.js";

/* Routes */
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import healthRoutes from "./routes/health.routes.js";
import leadCaptureRoutes from "./routes/leadCaptureRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import leadAssignmentRoutes
from "./routes/leadAssignmentRoutes.js";
import followupRoutes
from "./routes/followupRoutes.js";
import leadSourceRoutes from "./routes/leadSourceRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
/* Middlewares */
import { globalLimiter } from "./middleware/rateLimiter.js";
import requestId from "./middleware/requestId.js";
import requestLogger from "./middleware/requestLogger.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import employeePortalRoutes from "./routes/employeePortal.routes.js";

const app = express();

// Trust reverse proxy on Render / Cloudflare / Vercel
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

/**
 * =====================================================
 * Environment Validation
 * =====================================================
 */
validateEnv();

/**
 * =====================================================
 * Core Middlewares
 * =====================================================
 */
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (curl, health checks, server-to-server)
    if (!origin || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // Allow localhost & local live previews (127.0.0.1)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow configured client origins
    if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Permissive callback so public website forms and embeds can submit leads
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
}));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/**
 * =====================================================
 * Security Middlewares
 * =====================================================
 */
app.use(helmet());

app.use(compression());

app.use(hpp());

app.use(globalLimiter);

/**
 * =====================================================
 * Logging
 * =====================================================
 */
app.use(requestId);

app.use(requestLogger);

app.use(morgan("dev"));

/**
 * =====================================================
 * Root Endpoint
 * =====================================================
 */
app.get("/", (req, res) => {

  res.status(200).json({

    success: true,

    message: "IEM LMS API Running Successfully 🚀",

    version: "1.0.0",

  });

});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

/**
 * =====================================================
 * Health Routes
 * =====================================================
 */
app.use("/api", healthRoutes);

/**
 * =====================================================
 * API Routes
 * =====================================================
 */
app.use("/api/auth", authRoutes);

app.use("/api/campaigns", campaignRoutes);

app.use("/api/departments", departmentRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/employee", employeePortalRoutes);

app.use("/api/public", leadCaptureRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/lead-assignments", leadAssignmentRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/followups", followupRoutes);

app.use("/api/lead-sources", leadSourceRoutes);

app.use("/api/admissions", admissionRoutes);

app.use("/api/notifications", notificationRoutes);

/**
 * =====================================================
 * 404 Handler
 * =====================================================
 */
app.use(notFound);

/**
 * =====================================================
 * Global Error Handler
 * =====================================================
 */
app.use(errorHandler);

export default app;
