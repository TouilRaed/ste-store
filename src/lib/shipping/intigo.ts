import "server-only";

import { minorUnitsPer } from "@/lib/format";
import { localPhone } from "@/lib/phone";
import type { Order } from "@/lib/types";

/**
 * Intigo delivery — API v3 (https://api.intigo.net/api/v3).
 *
 * Auth is the `X-API-Key` header, not a bearer token. Everything
 * Intigo-specific lives here.
 *
 * We create parcels through `/parcels/by-name` rather than `/parcels/`,
 * because `/parcels/` wants numeric destination_city_id / district_id that we
 * have no way to know, while by-name takes the French (or Arabic) names.
 * `/parcels/by-postal-code` is not usable either: cash-on-delivery orders are
 * stored with postal_code "-", since the storefront form only asks for a
 * gouvernorat.
 *
 * City and district are strict — an unknown name is a 400 — so the admin picks
 * both from Intigo's own lists rather than typing them.
 */

const DEFAULT_BASE = "https://api.intigo.net/api/v3";

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
  return Boolean(process.env.INTIGO_API_KEY);
}

function baseUrl(): string {
  return (process.env.INTIGO_API_URL || DEFAULT_BASE).replace(/\/+$/, "");
}

type FetchOptions = RequestInit & {
  /** Seconds to cache. Regions change rarely; parcel calls must never cache. */
  revalidate?: number;
};

async function intigoFetch<T>(path: string, init?: FetchOptions): Promise<T> {
  const key = process.env.INTIGO_API_KEY;
  if (!key) {
    throw new ShippingError(
      "Intigo n'est pas configuré. Définissez INTIGO_API_KEY.",
      503,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
        ...(init?.headers ?? {}),
      },
      // Never hold an admin request open on a courier outage.
      signal: AbortSignal.timeout(15_000),
      ...(init?.revalidate
        ? { next: { revalidate: init.revalidate } }
        : { cache: "no-store" as const }),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "inconnue";
    throw new ShippingError(`Intigo est injoignable (${reason}).`);
  }

  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Non-JSON body; the raw text is reported in the error below.
  }

  if (!response.ok) {
    throw new ShippingError(describeError(response.status, body), response.status);
  }

  return body as T;
}

/**
 * Intigo returns either `{"detail": "..."}` or FastAPI's validation shape,
 * `{"detail": [{loc, msg, type}]}`. Flattening both keeps the admin from
 * seeing "[object Object]".
 */
function describeError(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        const entry = item as { loc?: unknown[]; msg?: string };
        const field = Array.isArray(entry.loc) ? entry.loc.at(-1) : undefined;
        return field ? `${field}: ${entry.msg ?? ""}`.trim() : (entry.msg ?? "");
      })
      .filter(Boolean);
    if (parts.length) return `Intigo a refusé la commande — ${parts.join(" ; ")}`;
  }

  if (typeof detail === "string" && detail.trim()) {
    if (status === 401) return "Clé API Intigo invalide ou absente.";
    if (status === 402) return `Intigo : ${detail} (solde insuffisant ?)`;
    return `Intigo : ${detail}`;
  }

  return `Intigo a répondu HTTP ${status}.`;
}

/* --- Regions ------------------------------------------------------------- */

export type IntigoCity = { id: number; name: string };
export type IntigoDistrict = { id: number; name: string };

function normaliseList(body: unknown, key?: string): { id: number; name: string }[] {
  const envelope = body as Record<string, unknown> | null;
  const rows = Array.isArray(body)
    ? body
    : (((key ? envelope?.[key] : undefined) ??
        envelope?.results ??
        envelope?.data ??
        []) as unknown[]);

  return (rows as Record<string, unknown>[])
    .map((row) => {
      const id = Number(row.id ?? row.city_id ?? row.district_id);
      const name = String(row.name ?? row.label ?? row.name_fr ?? "").trim();
      return { id, name };
    })
    .filter((row) => row.name.length > 0 && Number.isFinite(row.id));
}

export async function listCities(): Promise<IntigoCity[]> {
  return normaliseList(
    await intigoFetch("/regions/cities", { revalidate: 86_400 }),
    "cities",
  );
}

export async function listDistricts(cityId: number): Promise<IntigoDistrict[]> {
  return normaliseList(
    await intigoFetch(`/regions/cities/${cityId}/districts`, { revalidate: 86_400 }),
    "districts",
  );
}

export type IntigoPickupAddress = {
  id: number;
  index: number;
  city_name?: string;
  district_name?: string;
  street_address?: string;
};

export async function listPickupAddresses(): Promise<IntigoPickupAddress[]> {
  const body = await intigoFetch<{ pickup_addresses?: IntigoPickupAddress[] }>(
    "/pickup-addresses/",
  );
  return Array.isArray(body?.pickup_addresses) ? body.pickup_addresses : [];
}

/**
 * The account's pickup index, read from Intigo rather than assumed. Their
 * indexes are 1-based — defaulting to 0 sends the parcel to a pickup point
 * that does not exist.
 */
export async function defaultPickupIndex(): Promise<number> {
  const addresses = await listPickupAddresses();
  const index = addresses[0]?.index;
  if (typeof index !== "number") {
    throw new ShippingError(
      "Aucune adresse de ramassage configurée chez Intigo.",
      400,
    );
  }
  return index;
}

/* --- Parcel creation ----------------------------------------------------- */

/**
 * COD is quoted in DINARS, not minor units. `price` is what the driver
 * collects, so it is the order total including the 8 DT delivery — sending
 * 220000 where 220.000 is meant is only discovered at the customer's door.
 */
function codPrice(order: Order): number {
  const divisor = minorUnitsPer(order.currency ?? "TND");
  return Number((order.total_cents / divisor).toFixed(3));
}

function describeParcel(order: Order): string {
  const items = order.order_items ?? [];
  if (items.length === 0) return "Colis";
  const text = items
    .map((item) => `${item.quantity}× ${item.product_name}`)
    .join(", ");
  return text.slice(0, 500);
}

export type CreateParcelInput = {
  order: Order;
  cityName: string;
  districtName: string;
  /** Optional; Intigo ignores an unknown neighbourhood rather than failing. */
  neighborhoodName?: string;
  pickupIndex: number;
  packageSize?: number;
};

export async function createParcelByName({
  order,
  cityName,
  districtName,
  neighborhoodName,
  pickupIndex,
  packageSize = 1,
}: CreateParcelInput): Promise<{ nid: string; raw: unknown }> {
  const address = [order.address_line1, order.address_line2]
    .filter(Boolean)
    .join(", ")
    .slice(0, 500);

  const payload: Record<string, unknown> = {
    recipient_name: order.full_name.slice(0, 255),
    phone1: localPhone(order.phone),
    destination_address: address,
    city_name: cityName,
    district_name: districtName,
    price: codPrice(order),
    package_size: packageSize,
    description: describeParcel(order),
    pickup_index: pickupIndex,
    // Lets us reconcile an Intigo parcel back to our order later.
    cid: order.order_number.slice(0, 50),
  };

  if (neighborhoodName) payload.neighborhood_name = neighborhoodName;
  if (order.note) payload.additional_info = order.note.slice(0, 500);
  if (order.email) payload.client_email = order.email.slice(0, 254);

  const body = await intigoFetch<{ success?: boolean; nid?: string }>(
    "/parcels/by-name",
    { method: "POST", body: JSON.stringify(payload) },
  );

  const nid = typeof body?.nid === "string" ? body.nid.trim() : "";
  if (!nid) {
    throw new ShippingError("Intigo a répondu sans NID de colis.");
  }

  return { nid, raw: body };
}
