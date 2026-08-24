import "server-only";

import { NextResponse } from "next/server";
import { isAdminConfigured, isAuthorizedRequest } from "@/lib/admin/auth";
import { AdminError } from "@/lib/admin/repo";

/**
 * Wraps a route handler with the admin guard and a single error contract:
 * `{ error: string }` plus a meaningful status.
 */
export function withAdmin<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<NextResponse> | NextResponse,
) {
  return async (request: Request, ...args: Args): Promise<NextResponse> => {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Admin is not configured. Set ADMIN_PASSWORD and ADMIN_JWT_SECRET." },
        { status: 503 },
      );
    }

    if (!(await isAuthorizedRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof AdminError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("[admin api]", error);
      return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
