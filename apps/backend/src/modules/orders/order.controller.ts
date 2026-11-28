
import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import * as orderService from "./order.service.js";
import { checkoutSchema, listOrdersQuerySchema, orderIdSchema } from "./order.validation.js";

function getUserId(req: Parameters<RequestHandler>[0]): string {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  }

  return req.user.id;
}

export const checkout: RequestHandler = async (req, res) => {
  const input = checkoutSchema.parse(req.body);
  const order = await orderService.checkout(getUserId(req), input);

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: { order },
  });
};

export const listOrders: RequestHandler = async (req, res) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await orderService.listCustomerOrders(
    getUserId(req),
    query,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getOrder: RequestHandler = async (req, res) => {
  const { orderId } = orderIdSchema.parse(req.params);
  const order = await orderService.getCustomerOrder(
    getUserId(req),
    orderId,
  );

  res.status(200).json({
    success: true,
    data: { order },
  });
};

export const cancelOrder: RequestHandler = async (req, res) => {
  const { orderId } = orderIdSchema.parse(req.params);
  const order = await orderService.cancelCustomerOrder(
    getUserId(req),
    orderId,
  );

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: { order },
  });
};