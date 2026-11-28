import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as inventoryController from "./inventory.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "STAFF"));

router.get("/", inventoryController.list);

router.get("/:variantId", inventoryController.getByVariantId);

router.post(
  "/:variantId/adjustments",
  requireTrustedOrigin,
  inventoryController.adjust,
);

export default router;