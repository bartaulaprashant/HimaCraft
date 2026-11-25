import type { RequestHandler } from "express";

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    Object.assign(new Error(`Route not found: ${req.method} ${req.originalUrl}`), {
      statusCode: 404,
    })
  );
};