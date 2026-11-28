
import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import * as productService from "./product.service.js";

import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from "./product.validation.js";

export const create: RequestHandler = async (req, res) => {
  const input = createProductSchema.parse(req.body);

  const product = await productService.createProduct(input);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { product },
  });
};

export const getById: RequestHandler = async (req, res) => {
  const { productId } = productIdSchema.parse(req.params);

  const product = await productService.getProductById(productId);

  res.status(200).json({
    success: true,
    data: { product },
  });
};

export const update: RequestHandler = async (req, res) => {
  const { productId } = productIdSchema.parse(req.params);
  const input = updateProductSchema.parse(req.body);

  const product = await productService.updateProduct(productId, input);

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: { product },
  });
};

export const archive: RequestHandler = async (req, res) => {
  const { productId } = productIdSchema.parse(req.params);

  const product = await productService.archiveProduct(productId);

  res.status(200).json({
    success: true,
    message: "Product archived successfully",
    data: { product },
  });
};
