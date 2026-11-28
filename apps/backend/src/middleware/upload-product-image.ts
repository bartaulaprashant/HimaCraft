
import multer from "multer";
import type { RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new AppError(
          415,
          "Only JPEG, PNG, and WebP images are allowed",
          "INVALID_IMAGE_TYPE",
        ),
      );
    }

    callback(null, true);
  },
});

export const uploadProductImage: RequestHandler = (
  req,
  res,
  next,
) => {
  upload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            413,
            "Image size must not exceed 5 MB",
            "IMAGE_TOO_LARGE",
          ),
        );
      }

      return next(
        new AppError(400, error.message, "IMAGE_UPLOAD_ERROR"),
      );
    }

    if (error) {
      return next(error);
    }

    if (!req.file) {
      return next(
        new AppError(400, "Product image is required", "IMAGE_REQUIRED"),
      );
    }

    next();
  });
};
