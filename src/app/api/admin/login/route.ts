import { NextResponse } from "next/server";
import { SESSION_SECONDS, isAdminConfigured, issueToken, verifyPassword } from "@/lib/admin/auth";
import { clientIp, rateLimit } from "@/lib/admin/rate-limit";
import { loginSchema } from "@/lib/admin/schemas";
import { readJson } from "@/lib/admin/api";

/** Mobile login. Returns a bearer token; the web app uses a cookie instead. */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD and ADMIN_JWT_SECRET." },
      { status: 503 },
    );
  }

  const limit = rateLimit(`admin-login:${clientIp(request)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Password required" }, { status: 400 });

  if (!verifyPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, token: await issueToken(), expiresIn: SESSION_SECONDS });
}
