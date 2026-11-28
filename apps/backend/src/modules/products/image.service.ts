
import { prisma } from "../../config/database.js";
import { cloudinary } from "../../config/cloudinary.js";
import { AppError } from "../../shared/errors/app-error.js";

interface UploadImageInput {
  productId: string;
  buffer: Buffer;
  mimetype: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

interface UpdateImageInput {
  altText?: string | null;
  sortOrder?: number;
}

async function ensureProductExists(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
}

async function getImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!image) {
    throw new AppError(404, "Product image not found", "IMAGE_NOT_FOUND");
  }

  return image;
}

export async function uploadImage(input: UploadImageInput) {
  await ensureProductExists(input.productId);

  const uploaded = await cloudinary.uploader.upload(
    `data:${input.mimetype};base64,${input.buffer.toString("base64")}`,
    {
      folder: "himacraft/products",
      resource_type: "image",
    },
  );

  try {
    const image = await prisma.$transaction(async (tx) => {
      const imageCount = await tx.productImage.count({
        where: { productId: input.productId },
      });

      const isPrimary = input.isPrimary ?? imageCount === 0;

      if (isPrimary) {
        await tx.productImage.updateMany({
          where: { productId: input.productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.create({
        data: {
          productId: input.productId,
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          altText: input.altText,
          sortOrder: input.sortOrder ?? 0,
          isPrimary,
        },
      });
    });

    return image;
  } catch (error) {
    // Compensate for a failed database write.
    try {
      await cloudinary.uploader.destroy(uploaded.public_id);
    } catch (cleanupError) {
      console.error("Cloudinary upload cleanup failed:", cleanupError);
    }

    throw error;
  }
}

export async function listImages(productId: string) {
  await ensureProductExists(productId);

  return prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function updateImage(
  productId: string,
  imageId: string,
  input: UpdateImageInput,
) {
  await getImage(productId, imageId);

  return prisma.productImage.update({
    where: { id: imageId },
    data: input,
  });
}

export async function setPrimaryImage(
  productId: string,
  imageId: string,
) {
  await getImage(productId, imageId);

  return prisma.$transaction(async (tx) => {
    await tx.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    return tx.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  });
}

export async function removeImage(productId: string, imageId: string) {
  const image = await getImage(productId, imageId);

  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({
      where: { id: imageId },
    });

    if (image.isPrimary) {
      const nextImage = await tx.productImage.findFirst({
        where: { productId },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });

      if (nextImage) {
        await tx.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  // The database record is removed first. A failed Cloudinary cleanup
  // can leave an orphaned asset, but won't leave a broken image record.
  try {
    await cloudinary.uploader.destroy(image.publicId);
  } catch (error) {
    console.error("Cloudinary image cleanup failed:", error);
  }

  return { id: image.id, deleted: true };
}
