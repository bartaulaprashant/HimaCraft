import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as authController from "./auth.controller.js";

const router = Router();

// Public authentication endpoints
router.post("/register", requireTrustedOrigin, authController.register);
router.post("/login", requireTrustedOrigin, authController.login);
router.post("/refresh", requireTrustedOrigin, authController.refresh);
router.post("/logout", requireTrustedOrigin, authController.logout);

// Authenticated endpoints
router.get("/me", authenticate, authController.me);

router.post(
  "/logout-all",
  requireTrustedOrigin,
  authenticate,
  authController.logoutAll
);

// Example role-restricted endpoint.
// Use this pattern in admin/staff modules later.
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