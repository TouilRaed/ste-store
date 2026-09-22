import "server-only";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { META_GRAPH_VERSION, META_PIXEL_ID } from "@/lib/meta/config";
import { minorUnitsPer } from "@/lib/format";

/**
 * Server half of the Meta integration: the Conversions API.
 *
 * The browser pixel is blocked often enough — ad blockers, iOS, a shopper who
 * never loads the confirmation page — that a cash-on-delivery shop cannot rely
 * on it to count its own sales. Every event sent here carries an `event_id`
 * that the pixel also sends, so Meta keeps one conversion rather than two.
 *
 * Personal data is SHA-256 hashed before it leaves the server, as Meta
 * requires. Raw emails and phone numbers are never transmitted.
 */

/** Server-only. Absent means the shop has no Meta account wired up yet. */
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";

/**
 * Set while testing from Events Manager > Test events. Leave unset in
 * production — events carrying a test code do not reach ad optimisation.
 */
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE ?? "";

export const hasMetaCapi = META_PIXEL_ID.length > 0 && ACCESS_TOKEN.length > 0;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta wants lowercase, trimmed, whitespace-free values before hashing. */
function hashed(value: string | null | undefined): string | null {
  const normalised = String(value ?? "").trim().toLowerCase();
  return normalised.length > 0 ? sha256(normalised) : null;
}

/** Letters only, accents folded: "Ben Salah" and "ben salah" must hash alike. */
function hashedName(value: string | null | undefined): string | null {
  const normalised = String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return normalised.length > 0 ? sha256(normalised) : null;
}

/**
 * Digits with the country code and no punctuation, which is the only phone
 * shape Meta matches on. Orders store "+216 20 123 456"; an eight-digit local
 * number gets Tunisia's 216 put back in front of it.
 */
function hashedPhone(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 0) return null;
  const withCountry = digits.length === 8 ? `216${digits}` : digits;
  return sha256(withCountry);
}

type MetaUserData = {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  city?: string | null;
  /** ISO 3166-1 alpha-2. Orders store "Tunisie"/"Tunisia"; both map to "tn". */
  country?: string | null;
};

type MetaContent = {
  id: string;
  quantity: number;
  /** Minor units, converted to major units before being sent. */
  unitCents: number;
};

type MetaEvent = {
  eventName: "Purchase" | "InitiateCheckout" | "AddToCart" | "ViewContent" | "Lead";
  /** Shared with the browser pixel so Meta deduplicates the pair. */
  eventId: string;
  /** The page the shopper was on, as Meta's attribution expects. */
  eventSourceUrl?: string | null;
  user?: MetaUserData;
  contents?: MetaContent[];
  /** Minor units of `currency`, e.g. millimes for TND. */
  valueCents?: number;
  currency?: string;
  orderNumber?: string | null;
};

function countryCode(value: string | null | undefined): string | null {
  const folded = String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!folded) return null;
  if (folded.length === 2) return folded;
  // The only country this shop delivers to, spelled either way.
  if (folded.startsWith("tunis")) return "tn";
  return null;
}

/**
 * Builds the `user_data` block: hashed customer details plus the two
 * browser-side identifiers Meta matches on. `_fbp` is the pixel's own cookie
 * and `_fbc` records the click id a Facebook ad arrived with — together they
 * are what lifts match quality above what a hashed phone alone can do.
 */
async function buildUserData(user: MetaUserData | undefined) {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const space = String(user?.fullName ?? "").trim().indexOf(" ");
  const firstName = space > 0 ? user?.fullName?.slice(0, space) : user?.fullName;
  const lastName = space > 0 ? user?.fullName?.slice(space + 1) : null;

  // x-forwarded-for is a comma-separated chain; the client is the first entry.
  const forwarded = headerList.get("x-forwarded-for") ?? "";
  const clientIp = forwarded.split(",")[0]?.trim() || null;

  const data: Record<string, string | string[]> = {};
  const put = (key: string, value: string | null) => {
    if (value) data[key] = value;
  };

  put("em", hashed(user?.email));
  put("ph", hashedPhone(user?.phone));
  put("fn", hashedName(firstName));
  put("ln", hashedName(lastName));
  put("ct", hashedName(user?.city));
  put("country", hashed(countryCode(user?.country)));
  put("fbp", cookieStore.get("_fbp")?.value ?? null);
  put("fbc", cookieStore.get("_fbc")?.value ?? null);
  put("client_ip_address", clientIp);
  put("client_user_agent", headerList.get("user-agent"));

  return data;
}

/**
 * Sends one event to the Conversions API.
 *
 * Never throws and never rejects: an order is already committed by the time
 * this runs, and a marketing pixel must not be able to fail a sale. Failures
 * are logged in the same shape as the rest of the server code.
 */
export async function sendMetaEvent(event: MetaEvent): Promise<void> {
  if (!hasMetaCapi) return;

  try {
    const currency = (event.currency ?? "TND").toUpperCase();
    const divisor = minorUnitsPer(currency);

    const customData: Record<string, unknown> = {};
    if (event.valueCents !== undefined) {
      customData.value = event.valueCents / divisor;
      customData.currency = currency;
    }
    if (event.contents && event.contents.length > 0) {
      customData.content_type = "product";
      customData.content_ids = event.contents.map((c) => c.id);
      customData.contents = event.contents.map((c) => ({
        id: c.id,
        quantity: c.quantity,
        item_price: c.unitCents / divisor,
      }));
      customData.num_items = event.contents.reduce((sum, c) => sum + c.quantity, 0);
    }
    if (event.orderNumber) customData.order_id = event.orderNumber;

    // A server action has no URL of its own, so the page that submitted it —
    // the checkout, the product page — is the best source url available.
    const sourceUrl = event.eventSourceUrl ?? (await headers()).get("referer") ?? undefined;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: sourceUrl,
          // "website" even for a cash-on-delivery order placed on the site —
          // the conversion happened in the browser, not over the phone.
          action_source: "website",
          user_data: await buildUserData(event.user),
          custom_data: Object.keys(customData).length > 0 ? customData : undefined,
        },
      ],
    };

    if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`[meta] ${event.eventName} rejected (${response.status}):`, body.slice(0, 500));
    }
  } catch (error) {
    console.error(`[meta] ${event.eventName} failed:`, error);
  }
}
