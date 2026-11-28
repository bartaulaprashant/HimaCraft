import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as wishlistController from "./wishlist.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("CUSTOMER"));

router.get("/", wishlistController.get);

router.post(
  "/items",
  requireTrustedOrigin,
  wishlistController.addItem,
);

router.delete(
  "/items/:variantId",
  requireTrustedOrigin,
  wishlistController.removeItem,
);

export default router;
