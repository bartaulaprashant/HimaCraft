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

import { randomInt } from "node:crypto";
import { sendPasswordResetOtp } from "../../services/email.service.js";
import logger from "../../config/logger.js";

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


export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new AppError(401, "Account is not available", "ACCOUNT_UNAVAILABLE");
  }

  const isCurrentPasswordValid = await verifyPassword(
    user.passwordHash,
    currentPassword
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(400, "Current password is incorrect", "INVALID_CURRENT_PASSWORD");
  }

  if (await verifyPassword(user.passwordHash, newPassword)) {
    throw new AppError(
      400,
      "New password must be different from your current password",
      "PASSWORD_UNCHANGED"
    );
  }

  const newPasswordHash = await hashPassword(newPassword);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}

export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  // Do not reveal whether an email address has an account.
  if (!user || user.status !== "ACTIVE") {
    return;
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const otpHash = await hashPassword(otp);
  const now = new Date();

  const otpRecord = await prisma.$transaction(async (tx) => {
    await tx.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: now },
    });

    return tx.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      },
    });
  });

  try {
    await sendPasswordResetOtp(user.email, otp);
  } catch (error) {
    logger.error("Failed to deliver password reset email", {
      userId: user.id,
      message: error instanceof Error ? error.message : "Unknown email error",
    });

    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    throw new AppError(
      503,
      "Unable to send the password reset email. Please try again later.",
      "EMAIL_DELIVERY_FAILED"
    );
  }
}

export async function resetPassword(
  emailInput: string,
  otp: string,
  newPassword: string
) {
  const email = emailInput.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new AppError(400, "Invalid or expired reset code", "INVALID_RESET_OTP");
  }

  const otpRecord = await prisma.passwordResetOtp.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
      attempts: { lt: 5 },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError(400, "Invalid or expired reset code", "INVALID_RESET_OTP");
  }

  const isOtpValid = await verifyPassword(otpRecord.otpHash, otp);

  if (!isOtpValid) {
    await prisma.passwordResetOtp.updateMany({
      where: {
        id: otpRecord.id,
        usedAt: null,
        attempts: { lt: 5 },
      },
      data: { attempts: { increment: 1 } },
    });

    throw new AppError(400, "Invalid or expired reset code", "INVALID_RESET_OTP");
  }

  const newPasswordHash = await hashPassword(newPassword);
  const now = new Date();

  const consumed = await prisma.$transaction(async (tx) => {
    // Conditional update prevents the same OTP from being used twice.
    const result = await tx.passwordResetOtp.updateMany({
      where: {
        id: otpRecord.id,
        usedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: 5 },
      },
      data: { usedAt: now },
    });

    if (result.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await tx.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });

    // Invalidate any other outstanding reset codes.
    await tx.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: now },
    });

    return true;
  });

  if (!consumed) {
    throw new AppError(400, "Invalid or expired reset code", "INVALID_RESET_OTP");
  }
}
