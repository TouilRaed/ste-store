import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME, BRAND } from "@/lib/brand";

export const ADMIN_COOKIE = ADMIN_COOKIE_NAME;
export const SESSION_SECONDS = 60 * 60 * 24 * 30;

const ISSUER = BRAND.KEY;
const AUDIENCE = `${BRAND.KEY}-admin`;

/** True once an admin password and JWT secret are configured. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_JWT_SECRET);
}

function secretKey(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Constant-time comparison over digests so length never leaks. */
export function verifyPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function issueToken(subject = "admin"): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER, audience: AUDIENCE });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** Reads the admin session from the cookie (web) — used by Server Components. */
export async function hasAdminCookie(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

/**
 * Authorizes an API request from either client: `Authorization: Bearer <jwt>`
 * (mobile app) or the admin session cookie (web fetches).
 */
export async function isAuthorizedRequest(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return verifyToken(header.slice(7).trim());
  }
  return hasAdminCookie();
}
