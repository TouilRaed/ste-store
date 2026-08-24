import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS for the admin API so the Expo app can call it from a browser origin
 * (`expo start --web`, or a web build of the admin app). Native builds don't
 * need this — they aren't subject to CORS.
 *
 * Authorization is a bearer token, not a cookie, so allowing an origin here
 * cannot be replayed as a session: credentials are never sent automatically.
 * Allowed origins:
 *   - development: any localhost / 127.0.0.1 port (Metro picks its own)
 *   - production: exactly what ADMIN_CORS_ORIGINS lists (comma separated)
 */
function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;

  const configured = (process.env.ADMIN_CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configured.includes(origin)) return origin;

  if (process.env.NODE_ENV !== "production") {
    try {
      const { hostname } = new URL(origin);
      if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
    } catch {
      return null;
    }
  }

  return null;
}

export function proxy(request: NextRequest) {
  const origin = allowedOrigin(request.headers.get("origin"));

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: origin ? 204 : 403,
      headers: origin ? corsHeaders(origin) : undefined,
    });
  }

  const response = NextResponse.next();
  if (origin) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  return response;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export const config = {
  matcher: "/api/admin/:path*",
};
