import { Queue } from "bullmq";
import { redis } from "../../config/redis.js";

const QUEUE_NAME = "inventory";

let inventoryQueue: Queue | null = null;

export async function initializeInventoryQueue() {
  inventoryQueue = new Queue(QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5_000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  await inventoryQueue.waitUntilReady();

  await inventoryQueue.upsertJobScheduler(
    "inventory-reservation-expiry",
    { every: 60_000 },
    {
      name: "expire-stripe-reservations",
      data: {},
    },
  );
}

export async function closeInventoryQueue() {
  if (inventoryQueue) {
    await inventoryQueue.close();
    inventoryQueue = null;
  }
}