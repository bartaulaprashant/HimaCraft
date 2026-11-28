
import type { RequestHandler } from "express";
import * as catalogService from "./catalog.service.js";

import {
  productListQuerySchema,
  productSlugSchema,
} from "./catalog.validation.js";

export const list: RequestHandler = async (req, res) => {
  const query = productListQuerySchema.parse(req.query);

  const result = await catalogService.listPublicProducts(query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getBySlug: RequestHandler = async (req, res) => {
  const { slug } = productSlugSchema.parse(req.params);

  const product = await catalogService.getPublicProductBySlug(slug);

  res.status(200).json({
    success: true,
    data: { product },
  });
};
