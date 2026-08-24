import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAdmin } from "@/lib/admin/api";
import { AdminError } from "@/lib/admin/repo";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  // Expo tokens look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
  token: z.string().trim().min(10).max(200),
  platform: z.enum(["ios", "android", "web", "unknown"]).default("unknown"),
});

const unregisterSchema = z.object({ token: z.string().trim().min(10).max(200) });

function client() {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new AdminError(503, "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  return admin;
}

/** Registers this device for new-order pushes. Idempotent per token. */
export const POST = withAdmin(async (request) => {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Invalid device token" }, { status: 400 });

  const { error } = await client()
    .from("admin_devices")
    .upsert(
      {
        token: parsed.data.token,
        platform: parsed.data.platform,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

  if (error) {
    console.error("[devices] register failed:", error.message);
    return NextResponse.json({ error: "Could not register this device" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});

/** Called on sign-out so a handed-over phone stops receiving orders. */
export const DELETE = withAdmin(async (request) => {
  const parsed = unregisterSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Invalid device token" }, { status: 400 });

  const { error } = await client().from("admin_devices").delete().eq("token", parsed.data.token);
  if (error) {
    console.error("[devices] unregister failed:", error.message);
    return NextResponse.json({ error: "Could not remove this device" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
});
