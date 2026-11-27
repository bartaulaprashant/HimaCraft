import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

async function withSerializableRetry<T>(
  operation: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const isSerializationConflict =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2034";

      if (!isSerializationConflict || attempt === 3) {
        throw error;
      }
    }
  }

  throw new Error("Transaction retry limit exceeded");
}

const profileSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user) {
    throw new AppError(404, "Customer account not found", "CUSTOMER_NOT_FOUND");
  }

  return user;
}

export async function updateProfile(
  userId: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  },
) {
  const data = {
    ...input,
    ...(input.phone === "" ? { phone: null } : {}),
  };

  try {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelect,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      throw new AppError(404, "Customer account not found", "CUSTOMER_NOT_FOUND");
    }

    throw error;
  }
}

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { updatedAt: "desc" },
    ],
  });
}

type AddressInput = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isDefault?: boolean;
};

export async function createAddress(
  userId: string,
  input: AddressInput,
) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const existingCount = await tx.address.count({
          where: { userId },
        });

        const shouldBeDefault =
          input.isDefault === true || existingCount === 0;

        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.address.create({
          data: {
            userId,
            fullName: input.fullName,
            phone: input.phone,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country,
            isDefault: shouldBeDefault,
          },
        });
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>,
) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const existing = await tx.address.findFirst({
          where: { id: addressId, userId },
        });

        if (!existing) {
          throw new AppError(404, "Address not found", "ADDRESS_NOT_FOUND");
        }

        if (input.isDefault === true) {
          await tx.address.updateMany({
            where: {
              userId,
              isDefault: true,
              id: { not: addressId },
            },
            data: { isDefault: false },
          });
        }

        return tx.address.update({
          where: { id: addressId },
          data: input,
        });
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export async function deleteAddress(userId: string, addressId: string) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const existing = await tx.address.findFirst({
          where: { id: addressId, userId },
        });

        if (!existing) {
          throw new AppError(404, "Address not found", "ADDRESS_NOT_FOUND");
        }

        await tx.address.delete({
          where: { id: addressId },
        });

        if (existing.isDefault) {
          const replacement = await tx.address.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
          });

          if (replacement) {
            await tx.address.update({
              where: { id: replacement.id },
              data: { isDefault: true },
            });
          }
        }

        return { deletedAddressId: addressId };
      },
      { isolationLevel: "Serializable" },
    ),
  );
}
