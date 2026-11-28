import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import * as wishlistService from "./wishlist.service.js";

import {
  addWishlistItemSchema,
  wishlistVariantParamsSchema,
} from "./wishlist.validation.js";

function getUserId(req: Parameters<RequestHandler>[0]): string {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  }

  return req.user.id;
}

export const get: RequestHandler = async (req, res) => {
  const wishlist = await wishlistService.getWishlist(getUserId(req));

  res.status(200).json({
    success: true,
    data: { wishlist },
  });
};

export const addItem: RequestHandler = async (req, res) => {
  const input = addWishlistItemSchema.parse(req.body);

  const wishlist = await wishlistService.addWishlistItem(
    getUserId(req),
    input.variantId,
  );

  res.status(200).json({
    success: true,
    message: "Item added to wishlist",
    data: { wishlist },
  });
};

export const removeItem: RequestHandler = async (req, res) => {
  const { variantId } = wishlistVariantParamsSchema.parse(req.params);

  const wishlist = await wishlistService.removeWishlistItem(
    getUserId(req),
    variantId,
  );

  res.status(200).json({
    success: true,
    message: "Item removed from wishlist",
    data: { wishlist },
  });
};
