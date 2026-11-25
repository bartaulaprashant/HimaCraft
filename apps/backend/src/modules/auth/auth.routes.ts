
import { Router } from "express";

import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
} from "../../config/rate-limit.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as authController from "./auth.controller.js";

const router = Router();

// Public authentication endpoints
router.post(
  "/register",
  requireTrustedOrigin,
  registerRateLimiter,
  authController.register
);

router.post(
  "/login",
  requireTrustedOrigin,
  loginRateLimiter,
  authController.login
);

router.post(
  "/refresh",
  requireTrustedOrigin,
  refreshRateLimiter,
  authController.refresh
);

router.post("/logout", requireTrustedOrigin, authController.logout);

// Password reset endpoints
router.post(
  "/forgot-password",
  requireTrustedOrigin,
  forgotPasswordRateLimiter,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  requireTrustedOrigin,
  resetPasswordRateLimiter,
  authController.resetPassword
);

// Authenticated endpoints
router.get("/me", authenticate, authController.me);

router.post(
  "/change-password",
  requireTrustedOrigin,
  authenticate,
  authController.changePassword
);

router.post(
  "/logout-all",
  requireTrustedOrigin,
  authenticate,
  authController.logoutAll
);

// Temporary RBAC verification route.
router.get(
  "/admin-check",
  authenticate,
  authorize("ADMIN"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
    });
  }
);

export default router;
