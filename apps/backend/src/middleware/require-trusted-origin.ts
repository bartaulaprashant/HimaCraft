import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const trustedOrigin = new URL(env.FRONTEND_URL).origin;

export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");

  if (!origin || origin !== trustedOrigin) {
    res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
      code: "UNTRUSTED_ORIGIN",
    });
    return;
  }

  next();
};