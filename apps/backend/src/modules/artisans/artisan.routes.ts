import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireTrustedOrigin } from "../../middleware/require-trusted-origin.js";
import * as artisanController from "./artisan.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "STAFF"));

router.get("/", artisanController.list);
router.post("/", requireTrustedOrigin, artisanController.create);
router.get("/:artisanId", artisanController.getById);
router.patch("/:artisanId", requireTrustedOrigin, artisanController.update);
router.delete(
  "/:artisanId",
  requireTrustedOrigin,
  artisanController.deactivate,
);

export default router;
