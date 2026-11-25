import { createServer } from "node:http";

import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./config/logger.js";

import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

import {
  connectRedis,
  disconnectRedis,
} from "./config/redis.js";

const server = createServer(app);

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal}. Shutting down...`);

  server.close(async (error) => {
    try {
      await Promise.allSettled([
        disconnectDatabase(),
        disconnectRedis(),
      ]);

      if (error) {
        logger.error("Server shutdown error", error);
        process.exit(1);
      }

      logger.info("Server shutdown complete");
      process.exit(0);
    } catch (shutdownError) {
      logger.error("Shutdown failed", shutdownError);
      process.exit(1);
    }
  });
}

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();

    server.listen(env.PORT, () => {
      logger.info(`HimaCraft API listening on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error("Application startup failed", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

bootstrap();