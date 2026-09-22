"use client";

import { META_PIXEL_ID, hasMetaPixel } from "@/lib/meta/config";
import { minorUnitsPer } from "@/lib/format";

/**
 * Browser half of the Meta integration.
 *
 * Every call is a no-op when no pixel id is configured or when `fbq` has not
 * loaded — which is the normal state behind an ad blocker. The server-side
 * Conversions API covers those shoppers; see `@/lib/meta/capi`.
 */

type Fbq = {
  (command: "init", pixelId: string): void;
  (command: "track", event: string, params?: Record<string, unknown>, options?: { eventID: string }): void;
  (command: "trackCustom", event: string, params?: Record<string, unknown>, options?: { eventID: string }): void;
  queue?: unknown[];
};

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export type PixelContent = {
  id: string;
  quantity: number;
  /** Minor units, converted to major units before being sent. */
  unitCents: number;
};

type TrackOptions = {
  contents?: PixelContent[];
  valueCents?: number;
  currency?: string;
  /** Shared with the Conversions API copy so Meta keeps one conversion. */
  eventId?: string;
};

/**
 * Events raised before the pixel script has run.
 *
 * `fbq` is defined by the inline snippet, which loads with `afterInteractive`
 * — i.e. *after* hydration. A screen that tracks on mount (ViewContent on a
 * product page) therefore fires while `fbq` is still undefined, and would be
 * dropped. They wait here instead and are flushed once the snippet executes.
 *
 * Capped so that a blocked pixel, where the flush never comes, cannot grow
 * this without bound over a long browsing session.
 */
const pending: Array<[string, TrackOptions]> = [];
const PENDING_LIMIT = 20;

/** Called from the pixel script's onReady. Safe to call more than once. */
export function flushPixelQueue(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  const queued = pending.splice(0, pending.length);
  for (const [event, options] of queued) trackPixel(event, options);
}

export function trackPixel(event: string, options: TrackOptions = {}): void {
  if (!hasMetaPixel || typeof window === "undefined") return;

  if (!window.fbq) {
    if (pending.length < PENDING_LIMIT) pending.push([event, options]);
    return;
  }

  const currency = (options.currency ?? "TND").toUpperCase();
  const divisor = minorUnitsPer(currency);
  const params: Record<string, unknown> = {};

  if (options.valueCents !== undefined) {
    params.value = options.valueCents / divisor;
    params.currency = currency;
  }

  if (options.contents && options.contents.length > 0) {
    params.content_type = "product";
    params.content_ids = options.contents.map((c) => c.id);
    params.contents = options.contents.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      item_price: c.unitCents / divisor,
    }));
    params.num_items = options.contents.reduce((sum, c) => sum + c.quantity, 0);
  }

  window.fbq("track", event, params, options.eventId ? { eventID: options.eventId } : undefined);
}

export { META_PIXEL_ID, hasMetaPixel };
