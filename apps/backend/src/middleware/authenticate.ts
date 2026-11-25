import type { RequestHandler } from "express";

import { prisma } from "../config/database.js";
import { ACCESS_COOKIE } from "../shared/security/cookies.js";
import { verifyAccessToken } from "../shared/security/tokens.js";

export const authenticate: RequestHandler = async (req, res, next) => {
  const cookieToken = req.cookies?.[ACCESS_COOKIE];

  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "UNAUTHENTICATED",
    });
    return;
  }

  let payload;

  try {
    payload = await verifyAccessToken(token);
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
      code: "INVALID_ACCESS_TOKEN",
    });
    return;
  }

  // Verify that the session still exists and has not been revoked.
  // The database also provides the authoritative user role and status.
  const session = await prisma.refreshToken.findUnique({
    where: { id: payload.sessionId },
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

  if (
    !session ||
    session.userId !== payload.userId ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE"
  ) {
    res.status(401).json({
      success: false,
      message: "Session is no longer valid",
      code: "INVALID_SESSION",
    });
    return;
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
  };

  next();
};