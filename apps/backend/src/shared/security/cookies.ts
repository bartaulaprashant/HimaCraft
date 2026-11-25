import type { CookieOptions, Response } from "express";
import { env } from "../../config/env.js";
import { durationToMilliseconds } from "./duration.js";

export const ACCESS_COOKIE = "hc_access";
export const REFRESH_COOKIE = "hc_refresh";

const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1",
  maxAge: durationToMilliseconds(env.ACCESS_TOKEN_EXPIRES_IN),
};

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge: durationToMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN),
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions);
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}