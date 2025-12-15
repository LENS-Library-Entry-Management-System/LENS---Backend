import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import expressSanitizer from "express-sanitizer";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { sanitizeInput, limitRequestSize } from "./middleware/sanitizer";
import { csrfProtection, csrfTokenProvider } from "./middleware/csrf";
import publicRoutes from "./routes/publicRoutes";
import reportRoutes from "./routes/reportRoutes";
import auditRoutes from "./routes/auditRoutes";
import adminRoutes from "./routes/adminRoutes";
import systemRoutes from "./routes/systemRoutes";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Support multiple origins via comma-separated `CORS_ORIGIN` env var
const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:3000";
const corsWhitelist = corsOriginEnv
  .split(",")
  .map((s) => s.trim().replace(/\/$/, "")) // Remove trailing slash from whitelist entries
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);
      
      // allow if exact match, wildcard '*' present, or whitelist entry starts with '.' to allow subdomains
      const allowed = corsWhitelist.some((allowedEntry) => {
        if (allowedEntry === '*') return true;
        if (allowedEntry === origin) return true;
        if (allowedEntry.startsWith('.') && origin.endsWith(allowedEntry)) return true;
        return false;
      });

      if (allowed) return callback(null, true);
      
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-vercel-protection-bypass', 'x-csrf-token'],
  })
);

// Request size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Debug logging
app.use((req, _res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, JSON.stringify(req.body));
  }
  next();
});

// Input sanitization
app.use(expressSanitizer());
app.use(sanitizeInput);
app.use(limitRequestSize);

// Logging
app.use(
  morgan("combined", {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// CSRF token provider for authenticated routes
app.use("/api", csrfTokenProvider);

// API Routes with rate limiting and CSRF protection
import analyticsRoutes from "./routes/analyticsRoutes";
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import userRoutes from "./routes/userRoutes";

app.use("/api", apiRateLimiter, csrfProtection, analyticsRoutes);
app.use("/api/auth", authRoutes);

// Public routes must be mounted before protected entry routes to allow /entries/scan
app.use("/api", publicRoutes);

// Mount authenticated user routes before public routes so '/api/users/search' is handled
// by the protected `userRoutes` instead of the public `/users/:id` handler.
app.use("/api/users", csrfProtection, userRoutes);

app.use("/api/entries", csrfProtection, entryRoutes);
app.use("/api/reports", csrfProtection, reportRoutes);
app.use("/api/audit-logs", csrfProtection, auditRoutes);
app.use("/api/admins", csrfProtection, adminRoutes);
app.use("/api/system", csrfProtection, systemRoutes);

// Error handling
app.use(errorHandler);

export default app;
