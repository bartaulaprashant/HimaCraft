
import { Redis } from "ioredis";
import { env } from "./env.js";
import logger from "./logger.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

export async function connectRedis() {
  if (redis.status === "wait") {
    await redis.connect();
  }

  await redis.ping();

  logger.info("Redis connected");
}

export async function disconnectRedis() {
  if (redis.status !== "end") {
    await redis.quit();
  }

  logger.info("Redis disconnected");
}
