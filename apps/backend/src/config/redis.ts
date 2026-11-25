import ioredis, { Redis as NamedRedis } from "ioredis";
import { env } from "./env.js";
import logger from "./logger.js";

type RedisConstructor = new (
  url: string,
  options?: {
    lazyConnect?: boolean;
    maxRetriesPerRequest?: number | null;
    enableReadyCheck?: boolean;
  }
) => {
  status: string;
  connect: () => Promise<void>;
  ping: () => Promise<string>;
  quit: () => Promise<"OK">;
};

const RedisClient =
  (typeof NamedRedis === "function" ? NamedRedis : undefined) ??
  (typeof ioredis === "function"
    ? ioredis
    : (ioredis as unknown as { default?: RedisConstructor }).default);

if (!RedisClient) {
  throw new Error("Failed to resolve ioredis constructor");
}

export const redis = new RedisClient(env.REDIS_URL, {
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
