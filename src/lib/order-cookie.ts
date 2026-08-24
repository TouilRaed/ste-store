import { LAST_ORDER_COOKIE_NAME } from "@/lib/brand";

/** Cookie holding the last completed order, so the confirmation page can
 *  render even before Supabase credentials exist. Kept out of the
 *  "use server" module because those may only export async functions. */
export const LAST_ORDER_COOKIE = LAST_ORDER_COOKIE_NAME;
