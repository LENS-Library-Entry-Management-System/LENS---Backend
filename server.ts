import "dotenv/config";
import app from "./rfid-entry-backend/src/app";
import connectDB from "./rfid-entry-backend/src/config/database";
import logger from "./rfid-entry-backend/src/utils/logger";

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
