import "server-only";

import { minorUnitsPer } from "@/lib/format";
import type { Order } from "@/lib/types";

/**
 * Hands an order to Intigo for delivery.
 *
 * Everything Intigo-specific is confined to this file: the endpoint, the auth
 * header and the field names. If their contract differs from what is mapped
 * below, this is the only file that changes — the route, the button and the
 * database columns stay as they are.
 *
 * Configure with:
 *   INTIGO_API_URL   full URL of the create-shipment endpoint
 *   INTIGO_API_KEY   bearer token / API key issued by Intigo
 *   INTIGO_SENDER_*  optional pickup details, if the account needs them per call
 */

export class ShippingError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message);
    this.name = "ShippingError";
  }
}

export function isIntigoConfigured(): boolean {
  return Boolean(process.env.INTIGO_API_URL && process.env.INTIGO_API_KEY);
}

/**
 * Money leaves here as a DECIMAL STRING in dinars, not minor units. Carriers
 * quote cash-on-delivery in dinars, and sending 220000 where 220 is meant is
 * the kind of mistake that is only discovered at the customer's door.
 */
function codAmount(order: Order): string {
  const divisor = minorUnitsPer(order.currency ?? "TND");
  return (order.total_cents / divisor).toFixed(3);
}

export type ShipmentResult = {
  trackingCode: string;
  raw: unknown;
};

export async function createIntigoShipment(order: Order): Promise<ShipmentResult> {
  const url = process.env.INTIGO_API_URL;
  const key = process.env.INTIGO_API_KEY;

  if (!url || !key) {
    throw new ShippingError(
      "Intigo n'est pas configuré. Définissez INTIGO_API_URL et INTIGO_API_KEY.",
      503,
    );
  }

  const payload = {
    reference: order.order_number,
    recipient_name: order.full_name,
    recipient_phone: order.phone ?? "",
    address: [order.address_line1, order.address_line2].filter(Boolean).join(", "),
    governorate: order.city,
    postal_code: order.postal_code,
    // Cash on delivery: the driver collects this amount, in dinars.
    cod_amount: codAmount(order),
    note: order.note ?? "",
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      // A courier API should not hold an admin request open indefinitely.
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    throw new ShippingError(`Intigo est injoignable (${reason}).`);
  }

  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Leave it as text; it still goes into the error message below.
  }

  if (!response.ok) {
    throw new ShippingError(
      `Intigo a refusé la commande (HTTP ${response.status}) : ${text.slice(0, 200)}`,
    );
  }

  const trackingCode = readTrackingCode(body);
  if (!trackingCode) {
    throw new ShippingError(
      `Intigo a répondu sans code de suivi : ${text.slice(0, 200)}`,
    );
  }

  return { trackingCode, raw: body };
}

/** Accepts the usual spellings so a small contract change does not break this. */
function readTrackingCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const nested = (record.data ?? record.result ?? record) as Record<string, unknown>;
  for (const key of ["tracking_code", "trackingCode", "barcode", "code", "reference", "id"]) {
    const value = nested?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}
