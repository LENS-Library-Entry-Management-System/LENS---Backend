import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { sanitizeInput, limitRequestSize } from "./middleware/sanitizer";
import { csrfProtection, csrfTokenProvider } from "./middleware/csrf";
import publicRoutes from "./routes/publicRoutes";
import reportRoutes from "./routes/reportRoutes";

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
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Request size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Input sanitization
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
app.use("/api/entries", csrfProtection, entryRoutes);
// Mount authenticated user routes before public routes so '/api/users/search' is handled
// by the protected `userRoutes` instead of the public `/users/:id` handler.
app.use("/api/users", csrfProtection, userRoutes);
app.use("/api", publicRoutes);
app.use("/api/reports", csrfProtection, reportRoutes);

// Error handling
app.use(errorHandler);

export default app;
