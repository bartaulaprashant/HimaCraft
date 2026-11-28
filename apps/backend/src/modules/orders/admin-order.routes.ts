import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as adminOrderController from "./admin-order.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "STAFF"));

router.get("/", adminOrderController.list);
router.get("/:orderId", adminOrderController.getById);

router.patch(
  "/:orderId/status",
  requireTrustedOrigin,
  adminOrderController.updateStatus,
);

export default router;