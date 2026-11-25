import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

import { hashPassword, verifyPassword } from "../../shared/security/password.js";

import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  type UserRole,
} from "../../shared/security/tokens.js";

import { sanitizeUser } from "./auth.utils.js";

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

async function createSession(user: {
  id: string;
  role: UserRole;
}) {
  const refreshToken = generateRefreshToken();

  const session = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const accessToken = await generateAccessToken({
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const email = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
      select: publicUserSelect,
    });

    const session = await createSession({
      id: user.id,
      role: user.role,
    });

    return {
      user: sanitizeUser(user),
      ...session,
    };
  } catch (error) {
    // The unique constraint also protects against simultaneous registrations.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
    }

    throw error;
  }
}

export async function login(emailInput: string, password: string) {
  const email = emailInput.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "This account is not available", "ACCOUNT_UNAVAILABLE");
  }

  const session = await createSession({
    id: user.id,
    role: user.role,
  });

  return {
    user: sanitizeUser(user),
    ...session,
  };
}

export async function refreshSession(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!existing) {
      return { kind: "invalid" as const };
    }

    if (existing.revokedAt) {
      // A previously rotated token was presented again.
      // Revoke every remaining session for this user.
      await tx.refreshToken.updateMany({
        where: {
          userId: existing.userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return { kind: "reused" as const };
    }

    if (existing.expiresAt <= new Date()) {
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });

      return { kind: "expired" as const };
    }

    if (existing.user.status !== "ACTIVE") {
      await tx.refreshToken.updateMany({
        where: {
          userId: existing.userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return { kind: "unavailable" as const };
    }

    const revoked = await tx.refreshToken.updateMany({
      where: {
        id: existing.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (revoked.count !== 1) {
      return { kind: "reused" as const };
    }

    const newRefreshToken = generateRefreshToken();

    const newSession = await tx.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      kind: "success" as const,
      user: existing.user,
      refreshToken: newRefreshToken,
      sessionId: newSession.id,
    };
  });

  if (result.kind !== "success") {
    const messages = {
      invalid: "Invalid refresh token",
      reused: "Session reuse detected. Please log in again.",
      expired: "Session expired. Please log in again.",
      unavailable: "This account is not available",
    };

    throw new AppError(
      401,
      messages[result.kind],
      "INVALID_REFRESH_TOKEN"
    );
  }

  const accessToken = await generateAccessToken({
    userId: result.user.id,
    role: result.user.role,
    sessionId: result.sessionId,
  });

  return {
    user: sanitizeUser(result.user),
    accessToken,
    refreshToken: result.refreshToken,
  };
}

export async function logout(rawRefreshToken?: string) {
  if (!rawRefreshToken) return;

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(rawRefreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function logoutAll(userId: string) {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicUserSelect,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new AppError(401, "Account is not available", "ACCOUNT_UNAVAILABLE");
  }

  return sanitizeUser(user);
}