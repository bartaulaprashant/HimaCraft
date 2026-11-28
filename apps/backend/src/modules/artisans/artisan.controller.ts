
import type { RequestHandler } from "express";
import * as artisanService from "./artisan.service.js";
import {
  artisanIdSchema,
  createArtisanSchema,
  updateArtisanSchema,
} from "./artisan.validation.js";

export const list: RequestHandler = async (_req, res) => {
  const artisans = await artisanService.listArtisans();

  res.status(200).json({
    success: true,
    data: { artisans },
  });
};

export const getById: RequestHandler = async (req, res) => {
  const { artisanId } = artisanIdSchema.parse(req.params);
  const artisan = await artisanService.getArtisanById(artisanId);

  res.status(200).json({
    success: true,
    data: { artisan },
  });
};

export const create: RequestHandler = async (req, res) => {
  const input = createArtisanSchema.parse(req.body);
  const artisan = await artisanService.createArtisan(input);

  res.status(201).json({
    success: true,
    message: "Artisan created successfully",
    data: { artisan },
  });
};

export const update: RequestHandler = async (req, res) => {
  const { artisanId } = artisanIdSchema.parse(req.params);
  const input = updateArtisanSchema.parse(req.body);
  const artisan = await artisanService.updateArtisan(artisanId, input);

  res.status(200).json({
    success: true,
    message: "Artisan updated successfully",
    data: { artisan },
  });
};

export const deactivate: RequestHandler = async (req, res) => {
  const { artisanId } = artisanIdSchema.parse(req.params);
  const artisan = await artisanService.deactivateArtisan(artisanId);

  res.status(200).json({
    success: true,
    message: "Artisan deactivated successfully",
    data: { artisan },
  });
};
