import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";
import publicRoutes from "./routes/publicRoutes";
import reportRoutes from "./routes/reportRoutes";


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
import analyticsRoutes from "./routes/analyticsRoutes";
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import userRoutes from "./routes/userRoutes";

app.use("/api", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);
// Mount authenticated user routes before public routes so '/api/users/search' is handled
// by the protected `userRoutes` instead of the public `/users/:id` handler.
app.use("/api/users", userRoutes);
app.use("/api", publicRoutes);
app.use("/api/reports", reportRoutes);

// Error handling
app.use(errorHandler);

export default app;