import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as customerController from "./customer.controller.js";

const router = Router();

// All customer endpoints require an authenticated session.
router.use(authenticate);

// Customer profile
router.get("/me", customerController.getProfile);
router.patch(
  "/me",
  requireTrustedOrigin,
  customerController.updateProfile,
);

// Delivery addresses
router.get("/addresses", customerController.listAddresses);

router.post(
  "/addresses",
  requireTrustedOrigin,
  customerController.createAddress,
);

router.patch(
  "/addresses/:addressId",
  requireTrustedOrigin,
  customerController.updateAddress,
);

router.delete(
  "/addresses/:addressId",
  requireTrustedOrigin,
  customerController.deleteAddress,
);

export default router;
