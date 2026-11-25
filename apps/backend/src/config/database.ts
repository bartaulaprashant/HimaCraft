import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "./env.js";
import logger from "./logger.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
  log:
    env.NODE_ENV === "development"
      ? ["warn", "error"]
      : ["error"],
});

export async function connectDatabase() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;

  logger.info("PostgreSQL connected");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info("PostgreSQL disconnected");
}