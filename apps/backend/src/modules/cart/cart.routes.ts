import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as cartController from "./cart.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("CUSTOMER"));

router.get("/", cartController.get);

router.post(
  "/items",
  requireTrustedOrigin,
  cartController.addItem,
);

router.patch(
  "/items/:itemId",
  requireTrustedOrigin,
  cartController.updateItem,
);

router.delete(
  "/items/:itemId",
  requireTrustedOrigin,
  cartController.removeItem,
);

router.delete(
  "/",
  requireTrustedOrigin,
  cartController.clear,
);

export default router;
