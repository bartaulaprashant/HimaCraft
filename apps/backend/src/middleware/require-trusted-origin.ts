import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const trustedOrigin = new URL(env.FRONTEND_URL).origin;

export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  const fetchSite = req.get("sec-fetch-site");

  // Reject requests without the exact configured frontend origin.
  if (!origin || origin !== trustedOrigin) {
    res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
      code: "UNTRUSTED_ORIGIN",
    });
    return;
  }

  // Also reject browser requests explicitly identified as cross-site.
  if (fetchSite === "cross-site") {
    res.status(403).json({
      success: false,
      message: "Cross-site requests are not allowed",
      code: "CROSS_SITE_REQUEST",
    });
    return;
  }

  next();
};