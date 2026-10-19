import "server-only";

import { redirect } from "next/navigation";
import { hasAdminCookie } from "@/lib/admin/auth";

/** Server Component guard — bounces anonymous visitors to the login page. */
export async function requireAdminPage(): Promise<void> {
  if (!(await hasAdminCookie())) redirect("/meddm/login");
}
