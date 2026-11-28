
import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";

import * as categoryController from "./category.controller.js";

const router = Router();

// Admin and staff routes
router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "STAFF"),
  categoryController.listAll,
);

router.post(
  "/",
  requireTrustedOrigin,
  authenticate,
  authorize("ADMIN", "STAFF"),
  categoryController.create,
);

router.patch(
  "/:categoryId",
  requireTrustedOrigin,
  authenticate,
  authorize("ADMIN", "STAFF"),
  categoryController.update,
);

router.delete(
  "/:categoryId",
  requireTrustedOrigin,
  authenticate,
  authorize("ADMIN", "STAFF"),
  categoryController.remove,
);

// Public routes
router.get("/", categoryController.listPublic);
router.get("/:slug", categoryController.getPublicBySlug);

export default router;
