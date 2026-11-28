
import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as productController from "./product.controller.js";

const router = Router();

// All product management endpoints require ADMIN or STAFF.
router.use(authenticate);
router.use(authorize("ADMIN", "STAFF"));

router.post(
  "/",
  requireTrustedOrigin,
  productController.create,
);

router.get(
  "/:productId",
  productController.getById,
);

router.patch(
  "/:productId",
  requireTrustedOrigin,
  productController.update,
);

router.delete(
  "/:productId",
  requireTrustedOrigin,
  productController.archive,
);

export default router;
