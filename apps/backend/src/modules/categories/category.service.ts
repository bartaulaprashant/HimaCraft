
import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

import type {
  z,
} from "zod";

import type {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPrismaError(
  error: unknown,
  code: string,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function validateParent(
  parentId: string | null | undefined,
  categoryId?: string,
) {
  if (!parentId) return;

  if (parentId === categoryId) {
    throw new AppError(400, "A category cannot be its own parent", "INVALID_PARENT");
  }

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new AppError(404, "Parent category not found", "PARENT_NOT_FOUND");
  }

  // Prevent assigning one of this category's descendants as its parent.
  let currentParentId = parent.parentId;

  while (currentParentId) {
    if (currentParentId === categoryId) {
      throw new AppError(400, "This would create a category hierarchy cycle", "CATEGORY_CYCLE");
    }

    const ancestor = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });

    currentParentId = ancestor?.parentId ?? null;
  }
}

export async function listPublicCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function getPublicCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  return category;
}

export async function listAllCategories() {
  return prisma.category.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? slugify(input.name);

  if (!slug) {
    throw new AppError(
      400,
      "Provide a slug for this category",
      "INVALID_CATEGORY_SLUG",
    );
  }

  await validateParent(input.parentId);

  try {
    return await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
        parentId: input.parentId,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(409, "Category slug already exists", "CATEGORY_SLUG_EXISTS");
    }
    throw error;
  }
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new AppError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  await validateParent(input.parentId, categoryId);

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: input,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(409, "Category slug already exists", "CATEGORY_SLUG_EXISTS");
    }
    if (isPrismaError(error, "P2025")) {
      throw new AppError(404, "Category not found", "CATEGORY_NOT_FOUND");
    }
    throw error;
  }
}

export async function deleteCategory(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  if (category._count.products > 0) {
    throw new AppError(
      409,
      "Cannot delete a category that contains products",
      "CATEGORY_HAS_PRODUCTS",
    );
  }

  if (category._count.children > 0) {
    throw new AppError(
      409,
      "Cannot delete a category that contains child categories",
      "CATEGORY_HAS_CHILDREN",
    );
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return { id: categoryId };
}
