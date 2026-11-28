import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import * as cartService from "./cart.service.js";

import {
  addCartItemSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from "./cart.validation.js";

function getUserId(req: Parameters<RequestHandler>[0]): string {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  }

  return req.user.id;
}

export const get: RequestHandler = async (req, res) => {
  const cart = await cartService.getCart(getUserId(req));

  res.status(200).json({
    success: true,
    data: { cart },
  });
};

export const addItem: RequestHandler = async (req, res) => {
  const input = addCartItemSchema.parse(req.body);

  const cart = await cartService.addCartItem(
    getUserId(req),
    input.variantId,
    input.quantity,
  );

  res.status(200).json({
    success: true,
    message: "Item added to cart",
    data: { cart },
  });
};

export const updateItem: RequestHandler = async (req, res) => {
  const { itemId } = cartItemParamsSchema.parse(req.params);
  const input = updateCartItemSchema.parse(req.body);

  const cart = await cartService.updateCartItem(
    getUserId(req),
    itemId,
    input.quantity,
  );

  res.status(200).json({
    success: true,
    message: "Cart item updated",
    data: { cart },
  });
};

export const removeItem: RequestHandler = async (req, res) => {
  const { itemId } = cartItemParamsSchema.parse(req.params);

  const cart = await cartService.removeCartItem(getUserId(req), itemId);

  res.status(200).json({
    success: true,
    message: "Cart item removed",
    data: { cart },
  });
};

export const clear: RequestHandler = async (req, res) => {
  const result = await cartService.clearCart(getUserId(req));

  res.status(200).json({
    success: true,
    message: "Cart cleared",
    data: result,
  });
};
