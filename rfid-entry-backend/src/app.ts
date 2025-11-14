import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";
import publicRoutes from "./routes/publicRoutes";

// API Routes imports
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api", publicRoutes);

// Error handling
app.use(errorHandler);

export default app;