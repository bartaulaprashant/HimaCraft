
import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as productController from "./product.controller.js";
import * as variantController from "./variant.controller.js";
import * as imageController from "./image.controller.js";
import { uploadProductImage } from "../../middleware/upload-product-image.js";


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

//images endpoints
// Product image endpoints

router.get(
  "/:productId/images",
  imageController.list,
);

router.post(
  "/:productId/images",
  requireTrustedOrigin,
  uploadProductImage,
  imageController.upload,
);

router.patch(
  "/:productId/images/:imageId",
  requireTrustedOrigin,
  imageController.update,
);

router.patch(
  "/:productId/images/:imageId/primary",
  requireTrustedOrigin,
  imageController.setPrimary,
);

router.delete(
  "/:productId/images/:imageId",
  requireTrustedOrigin,
  imageController.remove,
);
export default router;
