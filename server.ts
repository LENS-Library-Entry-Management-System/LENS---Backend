import dotenv from "dotenv";
import app from "./rfid-entry-backend/src/app";
import { testConnection } from "./rfid-entry-backend/src/config/database";
import { testRedisConnection } from "./rfid-entry-backend/src/config/redis";

dotenv.config();

const PORT = process.env.PORT || 5000;

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
      console.log(`Reports API: http://localhost:${PORT}/api/reports`);
      console.log(`System Health: http://localhost:${PORT}/api/system/health`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

