import { rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";

import { redis } from "./redis.js";

function createRedisStore(prefix: string) {
  return new RedisStore({
    prefix,
 sendCommand: (...args: string[]) => {
  const [command, ...commandArgs] = args;

  if (!command) {
    throw new Error("Redis command is missing");
  }

  return redis.call(command, ...commandArgs) as Promise<RedisReply>;
},
  });
}

function createRateLimiter(options: {
  prefix: string;
  windowMs: number;
  limit: number;
  message: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store: createRedisStore(options.prefix),
    message: {
      success: false,
      message: options.message,
      code: "RATE_LIMIT_EXCEEDED",
    },
  });
}

export const registerRateLimiter = createRateLimiter({
  prefix: "himacraft:rate-limit:register:",
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many registration attempts. Please try again later.",
});

export const loginRateLimiter = createRateLimiter({
  prefix: "himacraft:rate-limit:login:",
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const refreshRateLimiter = createRateLimiter({
  prefix: "himacraft:rate-limit:refresh:",
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many session refresh attempts. Please try again later.",
});
export const forgotPasswordRateLimiter = createRateLimiter({
  prefix: "himacraft:rate-limit:forgot-password:",
  windowMs: 15 * 60 * 1000,
  limit: 3,
  message: "Too many password reset requests. Please try again later.",
});

export const resetPasswordRateLimiter = createRateLimiter({
  prefix: "himacraft:rate-limit:reset-password:",
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many password reset attempts. Please try again later.",
});