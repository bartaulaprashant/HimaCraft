
import Stripe from "stripe";

import { env } from "./env.js";
import { AppError } from "../shared/errors/app-error.js";

const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    throw new AppError(
      503,
      "Stripe payments are not configured",
      "STRIPE_NOT_CONFIGURED",
    );
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(
      503,
      "Stripe webhook is not configured",
      "STRIPE_WEBHOOK_NOT_CONFIGURED",
    );
  }

  return env.STRIPE_WEBHOOK_SECRET;
}
