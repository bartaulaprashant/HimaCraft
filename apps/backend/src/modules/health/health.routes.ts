import { Router } from "express";
import { prisma } from "../../config/database.js";
import { redis } from "../../config/redis.js";

const router = Router();

router.get("/live", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", async (_req, res) => {
  const results = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const databaseHealthy = results[0].status === "fulfilled";
  const redisHealthy = results[1].status === "fulfilled";

  const healthy = databaseHealthy && redisHealthy;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "ready" : "degraded",
    services: {
      database: databaseHealthy ? "connected" : "disconnected",
      redis: redisHealthy ? "connected" : "disconnected",
    },
  });
});

export default router;