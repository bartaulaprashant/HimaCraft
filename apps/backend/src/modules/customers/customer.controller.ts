import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import * as customerService from "./customer.service.js";

import {
  addressIdSchema,
  createAddressSchema,
  updateAddressSchema,
  updateProfileSchema,
} from "./customer.validation.js";

function getUserId(req: Parameters<RequestHandler>[0]): string {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  }

  return req.user.id;
}

export const getProfile: RequestHandler = async (req, res) => {
  const user = await customerService.getProfile(getUserId(req));

  res.status(200).json({
    success: true,
    data: { user },
  });
};

export const updateProfile: RequestHandler = async (req, res) => {
  const input = updateProfileSchema.parse(req.body);
  const user = await customerService.updateProfile(getUserId(req), input);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
};

export const listAddresses: RequestHandler = async (req, res) => {
  const addresses = await customerService.listAddresses(getUserId(req));

  res.status(200).json({
    success: true,
    data: { addresses },
  });
};

export const createAddress: RequestHandler = async (req, res) => {
  const input = createAddressSchema.parse(req.body);
  const address = await customerService.createAddress(getUserId(req), input);

  res.status(201).json({
    success: true,
    message: "Address created successfully",
    data: { address },
  });
};

export const updateAddress: RequestHandler = async (req, res) => {
  const { addressId } = addressIdSchema.parse(req.params);
  const input = updateAddressSchema.parse(req.body);

  const address = await customerService.updateAddress(
    getUserId(req),
    addressId,
    input,
  );

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: { address },
  });
};

export const deleteAddress: RequestHandler = async (req, res) => {
  const { addressId } = addressIdSchema.parse(req.params);

  await customerService.deleteAddress(getUserId(req), addressId);

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
};
