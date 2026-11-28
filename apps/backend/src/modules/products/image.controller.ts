
import type { RequestHandler } from "express";
import * as imageService from "./image.service.js";

import {
  imageParamsSchema,
  uploadImageSchema,
  updateImageSchema,
} from "./image.validation.js";

export const list: RequestHandler = async (req, res) => {
  const { productId } = imageParamsSchema
    .pick({ productId: true })
    .parse(req.params);

  const images = await imageService.listImages(productId);

  res.status(200).json({
    success: true,
    data: { images },
  });
};

export const upload: RequestHandler = async (req, res) => {
  const { productId } = imageParamsSchema
    .pick({ productId: true })
    .parse(req.params);

  const input = uploadImageSchema.parse(req.body);

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "Product image is required",
      code: "IMAGE_REQUIRED",
    });
    return;
  }

  const image = await imageService.uploadImage({
    productId,
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    ...input,
  });

  res.status(201).json({
    success: true,
    message: "Product image uploaded successfully",
    data: { image },
  });
};

export const update: RequestHandler = async (req, res) => {
  const { productId, imageId } = imageParamsSchema.parse(req.params);
  const input = updateImageSchema.parse(req.body);

  const image = await imageService.updateImage(
    productId,
    imageId,
    input,
  );

  res.status(200).json({
    success: true,
    message: "Product image updated successfully",
    data: { image },
  });
};

export const setPrimary: RequestHandler = async (req, res) => {
  const { productId, imageId } = imageParamsSchema.parse(req.params);

  const image = await imageService.setPrimaryImage(productId, imageId);

  res.status(200).json({
    success: true,
    message: "Primary product image updated successfully",
    data: { image },
  });
};

export const remove: RequestHandler = async (req, res) => {
  const { productId, imageId } = imageParamsSchema.parse(req.params);

  const result = await imageService.removeImage(productId, imageId);

  res.status(200).json({
    success: true,
    message: "Product image removed successfully",
    data: result,
  });
};
