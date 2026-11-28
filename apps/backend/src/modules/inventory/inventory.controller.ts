import type { RequestHandler } from "express";

import * as inventoryService from "./inventory.service.js";

import {
  inventoryAdjustmentBodySchema,
  inventoryListQuerySchema,
  inventoryVariantParamsSchema,
} from "./inventory.validation.js";

export const list: RequestHandler = async (req, res) => {
  const query = inventoryListQuerySchema.parse(req.query);

  const result = await inventoryService.listInventory(query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getByVariantId: RequestHandler = async (req, res) => {
  const { variantId } = inventoryVariantParamsSchema.parse(req.params);

  const inventory =
    await inventoryService.getInventoryByVariantId(variantId);

  res.status(200).json({
    success: true,
    data: { inventory },
  });
};

export const adjust: RequestHandler = async (req, res) => {
  const { variantId } = inventoryVariantParamsSchema.parse(req.params);
  const body = inventoryAdjustmentBodySchema.parse(req.body);

  const result = await inventoryService.adjustInventory(variantId, body);

  res.status(200).json({
    success: true,
    message: "Inventory adjusted successfully",
    data: result,
  });
};