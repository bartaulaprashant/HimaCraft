import type { RequestHandler } from "express";
import type { UserRole } from "../shared/security/tokens.js";

import { AppError } from "../shared/errors/app-error.js";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission", "FORBIDDEN"));
      return;
    }

    next();
  };
}