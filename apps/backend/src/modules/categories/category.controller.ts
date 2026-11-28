
import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import * as categoryService from "./category.service.js";

import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";

export const listPublic: RequestHandler = async (_req, res) => {
  const categories = await categoryService.listPublicCategories();

  res.status(200).json({
    success: true,
    data: { categories },
  });
};

export const getPublicBySlug: RequestHandler = async (req, res) => {
  const slug = req.params.slug;

  if (Array.isArray(slug) || typeof slug !== "string" || !slug) {
  throw new AppError(400, "Category slug is required", "INVALID_SLUG");
}

  const category = await categoryService.getPublicCategoryBySlug(slug);

  res.status(200).json({
    success: true,
    data: { category },
  });
};

export const listAll: RequestHandler = async (_req, res) => {
  const categories = await categoryService.listAllCategories();

  res.status(200).json({
    success: true,
    data: { categories },
  });
};

export const create: RequestHandler = async (req, res) => {
  const input = createCategorySchema.parse(req.body);
  const category = await categoryService.createCategory(input);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: { category },
  });
};

export const update: RequestHandler = async (req, res) => {
  const { categoryId } = categoryIdSchema.parse(req.params);
  const input = updateCategorySchema.parse(req.body);

  const category = await categoryService.updateCategory(categoryId, input);

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: { category },
  });
};

export const remove: RequestHandler = async (req, res) => {
  const { categoryId } = categoryIdSchema.parse(req.params);

  const result = await categoryService.deleteCategory(categoryId);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
};
