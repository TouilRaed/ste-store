"use client";

import { useEffect } from "react";
import { purchaseEventId } from "@/lib/meta/config";
import { trackPixel, type PixelContent } from "@/lib/meta/pixel";

/**
 * Fires the browser half of the Purchase event on the confirmation page.
 *
 * The server already sent the same conversion through the Conversions API
 * with this exact `event_id`, so Meta keeps whichever arrives first and drops
 * the duplicate. Firing both is the point: the pixel carries the browser
 * signals, the server copy survives ad blockers.
 */
export function MetaPurchase({
  orderNumber,
  valueCents,
  currency,
  contents,
}: {
  orderNumber: string;
  valueCents: number;
  currency: string;
  contents: PixelContent[];
}) {
  useEffect(() => {
    // A refresh of the confirmation page would otherwise re-fire it. Meta
    // would still deduplicate, but only for a limited window.
    const key = `meta.purchase.${orderNumber}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Private mode or storage disabled — send it anyway.
    }

    trackPixel("Purchase", {
      eventId: purchaseEventId(orderNumber),
      valueCents,
      currency,
      contents,
    });
  }, [orderNumber, valueCents, currency, contents]);

  return null;
}
