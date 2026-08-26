import app from "./app.js";
import pool from "./config/db.js";
import logger from "./utils/logger.js";
import { initDatabaseSchema } from "./config/dbInit.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  try {
    await initDatabaseSchema();
  } catch (err) {
    logger.error("DB init warning:", err.message);
  }
});

/**
 * =====================================================
 * Graceful Shutdown
 * =====================================================
 */

const gracefulShutdown = async (signal) => {

  logger.info(`${signal} received. Shutting down server...`);

  server.close(async () => {

    try {

      await pool.end();

      logger.info("✅ Database disconnected.");

      logger.info("✅ Server stopped successfully.");

      process.exit(0);

    } catch (error) {

      logger.error(error);

      process.exit(1);

    }

  });

};

/**
 * Ctrl + C
 */

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});

/**
 * Docker / Render
 */

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

/**
 * Unhandled Promise
 */

process.on("unhandledRejection", (error) => {

  logger.error(error);

  gracefulShutdown("UNHANDLED_REJECTION");

});

/**
 * Unexpected Exception
 */

process.on("uncaughtException", (error) => {

  logger.error(error);

  gracefulShutdown("UNCAUGHT_EXCEPTION");

});