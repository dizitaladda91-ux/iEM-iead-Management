import app from "./app.js";
import pool from "./config/db.js";
import logger from "./utils/logger.js";
import { initDatabaseSchema } from "./config/dbInit.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info("Initializing and verifying database schema...");
    await initDatabaseSchema();
    logger.info("✅ Database schema initialized successfully.");

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down server...`);
      server.close(async () => {
        try {
          await pool.end();
          logger.info("✅ Database disconnected.");
          logger.info("✅ Server stopped successfully.");
          process.exit(0);
        } catch (error) {
          logger.error("Error during database disconnection:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled Rejection:", error);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });
  } catch (fatalError) {
    logger.error("❌ Fatal Startup Error - Database initialization failed:", fatalError);
    process.exit(1);
  }
};

startServer();