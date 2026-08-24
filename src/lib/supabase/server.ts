import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True once the project has real Supabase credentials in the environment. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Request-scoped client that carries the visitor's auth cookies.
 * Returns null when Supabase isn't configured yet so callers can fall back
 * to the bundled demo catalogue instead of crashing the page.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — the proxy refreshes the
          // session cookie instead, so this is safe to swallow.
        }
      },
    },
  });
}

/**
 * Elevated client that bypasses RLS. Server-only: never import this into a
 * Client Component and never expose the key to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
