
import type { RequestHandler } from "express";
import * as variantService from "./variant.service.js";
import {
  productIdSchema,
  variantParamsSchema,
  createVariantSchema,
  updateVariantSchema,
} from "./variant.validation.js";

export const list: RequestHandler = async (req, res) => {
  const { productId } = productIdSchema.parse(req.params);
  const variants = await variantService.listVariants(productId);

  res.status(200).json({
    success: true,
    data: { variants },
  });
};

export const getById: RequestHandler = async (req, res) => {
  const { productId, variantId } = variantParamsSchema.parse(req.params);
  const variant = await variantService.getVariantById(productId, variantId);

  res.status(200).json({
    success: true,
    data: { variant },
  });
};

export const create: RequestHandler = async (req, res) => {
  const { productId } = productIdSchema.parse(req.params);
  const input = createVariantSchema.parse(req.body);

  const variant = await variantService.createVariant(productId, input);

  res.status(201).json({
    success: true,
    message: "Product variant created successfully",
    data: { variant },
  });
};

export const update: RequestHandler = async (req, res) => {
  const { productId, variantId } = variantParamsSchema.parse(req.params);
  const input = updateVariantSchema.parse(req.body);

  const variant = await variantService.updateVariant(
    productId,
    variantId,
    input,
  );

  res.status(200).json({
    success: true,
    message: "Product variant updated successfully",
    data: { variant },
  });
};

export const deactivate: RequestHandler = async (req, res) => {
  const { productId, variantId } = variantParamsSchema.parse(req.params);

  const variant = await variantService.deactivateVariant(
    productId,
    variantId,
  );

  res.status(200).json({
    success: true,
    message: "Product variant deactivated successfully",
    data: { variant },
  });
};
