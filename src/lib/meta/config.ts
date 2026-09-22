/**
 * Meta (Facebook) pixel and Conversions API wiring.
 *
 * Nothing here throws when the shop has no Meta account yet: without a pixel
 * id the browser script is never injected, and without an access token the
 * server-side calls are skipped. That mirrors how Supabase and Intigo degrade
 * elsewhere in the codebase.
 */

/** Inlined into the client bundle at build time, so it must be NEXT_PUBLIC_. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

/** False hides the pixel entirely rather than loading it with a blank id. */
export const hasMetaPixel = META_PIXEL_ID.length > 0;

/** Graph API version the Conversions API calls are pinned to. */
export const META_GRAPH_VERSION = "v21.0";

/**
 * Event ids are shared between the browser pixel and the Conversions API so
 * Meta collapses the two copies into one conversion. An order number is
 * unique and stable, which is exactly what deduplication needs.
 */
export function purchaseEventId(orderNumber: string): string {
  return `purchase.${orderNumber}`;
}
