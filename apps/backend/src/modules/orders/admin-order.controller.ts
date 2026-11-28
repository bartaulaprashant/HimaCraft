import type { RequestHandler } from "express";

import * as adminOrderService from "./admin-order.service.js";
import {
  adminOrderIdSchema,
  adminOrderListQuerySchema,
  updateAdminOrderStatusSchema,
} from "./admin-order.validation.js";

export const list: RequestHandler = async (req, res) => {
  const query = adminOrderListQuerySchema.parse(req.query);
  const result = await adminOrderService.listOrders(query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getById: RequestHandler = async (req, res) => {
  const { orderId } = adminOrderIdSchema.parse(req.params);
  const order = await adminOrderService.getOrderById(orderId);

  res.status(200).json({
    success: true,
    data: { order },
  });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { orderId } = adminOrderIdSchema.parse(req.params);
  const input = updateAdminOrderStatusSchema.parse(req.body);

  const order = await adminOrderService.updateOrderStatus(orderId, input);

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: { order },
  });
};