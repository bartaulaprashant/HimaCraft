import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error.js";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
    return;
  }

  logger.error("Unhandled application error", {
    message: error.message,
    stack: error.stack,
  });

  if (error.statusCode === 404) {
    res.status(404).json({
      success: false,
      message: error.message,
      code: "NOT_FOUND",
    });
    return;
  }

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production" ? "Internal server error" : error.message,
  });
};
