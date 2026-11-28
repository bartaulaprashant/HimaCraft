import { Worker } from "bullmq";

import { redis } from "../../config/redis.js";
import logger from "../../config/logger.js";
import { expireStripeReservations } from "../../modules/inventory/reservation.service.js";

const QUEUE_NAME = "inventory";

let inventoryWorker: Worker | null = null;

export async function startInventoryWorker() {
  inventoryWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== "expire-stripe-reservations") {
        throw new Error(`Unknown inventory job: ${job.name}`);
      }

      const result = await expireStripeReservations();

      logger.info("Stripe reservation expiry job completed", {
        expired: result.expired,
      });

      return result;
    },
    {
      connection: redis,
      concurrency: 1,
    },
  );

  inventoryWorker.on("failed", (job, error) => {
    logger.error("Inventory background job failed", {
      jobId: job?.id,
      jobName: job?.name,
      error,
    });
  });

  inventoryWorker.on("error", (error) => {
    logger.error("Inventory worker error", { error });
  });

  await inventoryWorker.waitUntilReady();

  logger.info("Inventory worker started");
}

export async function stopInventoryWorker() {
  if (inventoryWorker) {
    await inventoryWorker.close();
    inventoryWorker = null;

    logger.info("Inventory worker stopped");
  }
}