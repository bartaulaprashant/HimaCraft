import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

import { env } from "../../config/env.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function getRefreshTokenExpiry(): Date {
  return new Date(
    Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRES_IN) * 1000
  );
}

export async function generateAccessToken(
  payload: AccessTokenPayload
): Promise<string> {
  return new SignJWT({
    role: payload.role,
    sid: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuer("himacraft-api")
    .setAudience("himacraft-client")
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_EXPIRES_IN)
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    algorithms: ["HS256"],
    issuer: "himacraft-api",
    audience: "himacraft-client",
  });

  if (
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    !["CUSTOMER", "STAFF", "ADMIN"].includes(payload.role as string)
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: payload.sub,
    role: payload.role as UserRole,
    sessionId: payload.sid,
  };
}

function parseDuration(value: string): number {
  const match = value.trim().match(/^(\d+)(s|m|h|d)$/);

  if (!match) {
    throw new Error(`Invalid token duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return amount * multipliers[unit];
}