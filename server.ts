import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { testConnection } from "./rfid-entry-backend/src/config/database";
// import { syncDatabase } from './rfid-entry-backend/src/config/syncDatabase';
import { testRedisConnection } from "./rfid-entry-backend/src/config/redis";
import authRoutes from "./rfid-entry-backend/src/routes/authRoutes";
import EntryRoutes from './rfid-entry-backend/src/routes/entryRoutes'
import publicRoutes from './rfid-entry-backend/src/routes/publicRoutes';
import userRoutes from './rfid-entry-backend/src/routes/userRoutes';
import auditRoutes from './rfid-entry-backend/src/routes/auditRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes (authenticated routes first)
app.use('/api/auth', authRoutes);
app.use('/api/entries', EntryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// Public routes (no auth required) - mount after authenticated routes to avoid conflicts
app.use('/api', publicRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "LENS Backend is running",
    database: "PostgreSQL",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use(
  (
    err: Error & { status?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// Start server
const startServer = async () => {
  try {
    // Test PostgreSQL connection
    await testConnection();
    await testRedisConnection();

    app.listen(PORT, () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`LENS Backend Server Running`);
      console.log(`Port: ${PORT}`);
      console.log(`Database: PostgreSQL`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`API: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Auth API: http://localhost:${PORT}/api/auth`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
