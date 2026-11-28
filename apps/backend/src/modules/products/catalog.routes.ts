
import { Router } from "express";
import * as catalogController from "./catalog.controller.js"

const router = Router();

router.get("/", catalogController.list);
router.get("/slug/:slug", catalogController.getBySlug);

export default router;
