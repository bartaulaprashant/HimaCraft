import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "../../shared/security/cookies.js";

import * as authService from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);

  const result = await authService.register(input);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: {
      user: result.user,
    },
  });
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);

  const result = await authService.login(input.email, input.password);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
    },
  });
};

export const refresh: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  if (!refreshToken) {
    throw new AppError(401, "Refresh token required", "REFRESH_TOKEN_REQUIRED");
  }

  const result = await authService.refreshSession(refreshToken);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Session refreshed",
    data: {
      user: result.user,
    },
  });
};

export const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  await authService.logout(refreshToken);
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const logoutAll: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  }

  await authService.logoutAll(req.user.id);
  clearAuthCookies(res);
  
  res.status(200).json({
    success: true,
    message: "All sessions have been revoked",
  });
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  }

  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
};