
import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { z } from "zod";
import type {
  createArtisanSchema,
  updateArtisanSchema,
} from "./artisan.validation.js";

type CreateArtisanInput = z.infer<typeof createArtisanSchema>;
type UpdateArtisanInput = z.infer<typeof updateArtisanSchema>;

const artisanInclude = {
  _count: {
    select: { products: true },
  },
} as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

export async function listArtisans() {
  return prisma.artisan.findMany({
    orderBy: { name: "asc" },
    include: artisanInclude,
  });
}

export async function getArtisanById(artisanId: string) {
  const artisan = await prisma.artisan.findUnique({
    where: { id: artisanId },
    include: artisanInclude,
  });

  if (!artisan) {
    throw new AppError(404, "Artisan not found", "ARTISAN_NOT_FOUND");
  }

  return artisan;
}

export async function createArtisan(input: CreateArtisanInput) {
  const slug = input.slug ?? slugify(input.name);

  if (!slug) {
    throw new AppError(
      400,
      "Provide a valid artisan slug",
      "INVALID_ARTISAN_SLUG",
    );
  }

  try {
    return await prisma.artisan.create({
      data: { ...input, slug },
      include: artisanInclude,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        409,
        "Artisan slug already exists",
        "ARTISAN_SLUG_EXISTS",
      );
    }

    throw error;
  }
}

export async function updateArtisan(
  artisanId: string,
  input: UpdateArtisanInput,
) {
  const existing = await prisma.artisan.findUnique({
    where: { id: artisanId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, "Artisan not found", "ARTISAN_NOT_FOUND");
  }

  try {
    return await prisma.artisan.update({
      where: { id: artisanId },
      data: input,
      include: artisanInclude,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        409,
        "Artisan slug already exists",
        "ARTISAN_SLUG_EXISTS",
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw new AppError(404, "Artisan not found", "ARTISAN_NOT_FOUND");
    }

    throw error;
  }
}

export async function deactivateArtisan(artisanId: string) {
  try {
    return await prisma.artisan.update({
      where: { id: artisanId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new AppError(404, "Artisan not found", "ARTISAN_NOT_FOUND");
    }

    throw error;
  }
}
