
import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as productController from "./product.controller.js";
import * as variantController from "./variant.controller.js";


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

//variants endpoints 

router.get("/:productId/variants", variantController.list);

router.post(
  "/:productId/variants",
  requireTrustedOrigin,
  variantController.create,
);

router.get(
  "/:productId/variants/:variantId",
  variantController.getById,
);

router.patch(
  "/:productId/variants/:variantId",
  requireTrustedOrigin,
  variantController.update,
);

router.delete(
  "/:productId/variants/:variantId",
  requireTrustedOrigin,
  variantController.deactivate,
);

export default router;
