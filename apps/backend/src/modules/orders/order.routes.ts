import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as orderController from "./order.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("CUSTOMER"));

router.get("/", orderController.listOrders);
router.get("/:orderId", orderController.getOrder);

router.post(
  "/checkout",
  requireTrustedOrigin,
  orderController.checkout,
);

router.post(
  "/:orderId/cancel",
  requireTrustedOrigin,
  orderController.cancelOrder,
);

export default router;