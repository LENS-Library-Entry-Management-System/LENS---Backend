import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler";
import logger from "./utils/logger";

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
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import userRoutes from "./routes/userRoutes";
import rfidRoutes from "./routes/rfidRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rfid", rfidRoutes);

// Error handling
app.use(errorHandler);

export default app;
