"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { fallbackProducts } from "@/lib/catalog/fallback";
import { shippingFor } from "@/lib/format";
import { notifyNewOrder } from "@/lib/admin/push";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import type { CartLine, ProductOffer } from "@/lib/types";
import { LAST_ORDER_COOKIE } from "@/lib/order-cookie";
import { GOVERNORATES, normalisePhone } from "@/lib/tunisia";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type IncomingLine = {
  productId: string;
  slug: string;
  size: string | null;
  color: string | null;
  /** Name only — the price behind it is re-read from the product server-side. */
  offerName: string | null;
  quantity: number;
};

/**
 * postal_code and country are no longer collected — the checkout asks for a
 * gouvernorat and délégation instead, and both are filled server-side.
 */
const REQUIRED_FIELDS: Array<[keyof ShippingDetails, string]> = [
  ["full_name", "Le nom est obligatoire"],
  ["email", "L'e-mail est obligatoire"],
  ["address_line1", "L'adresse est obligatoire"],
  ["city", "Choisissez un gouvernorat"],
];

type ShippingDetails = {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  /** Délégation, from Intigo's list — same as the cash-on-delivery form. */
  district: string | null;
  postal_code: string;
  country: string;
  note: string;
};

/**
 * Matches a client-supplied offer name against the product's own offers.
 * Returns null for an unknown name, so an invented offer silently falls back
 * to the base price rather than becoming a discount the shop never offered.
 */
function resolveOffer(offers: unknown, offerName: string | null | undefined): ProductOffer | null {
  if (!offerName || !Array.isArray(offers)) return null;
  const match = (offers as ProductOffer[]).find(
    (offer) => offer && typeof offer.name === "string" && offer.name === offerName,
  );
  if (!match || typeof match.price_cents !== "number" || !Number.isFinite(match.price_cents)) {
    return null;
  }
  return match;
}

function readShipping(formData: FormData): ShippingDetails {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    full_name: get("full_name"),
    email: get("email"),
    phone: get("phone"),
    address_line1: get("address_line1"),
    address_line2: get("address_line2"),
    // The checkout now asks for a gouvernorat and délégation from Intigo's
    // lists, exactly like the product page — so a cart order is bookable too.
    city: get("governorate"),
    district: get("district") || null,
    postal_code: "-",
    country: "Tunisie",
    note: get("note"),
  };
}

function parseLines(raw: string): IncomingLine[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((line) => {
        const l = line as Partial<CartLine>;
        return {
          productId: String(l.productId ?? ""),
          slug: String(l.slug ?? ""),
          size: l.size ?? null,
          color: l.color ?? null,
          offerName: l.offerName ?? null,
          quantity: Math.max(1, Math.min(20, Number(l.quantity) || 0)),
        };
      })
      .filter((l) => l.slug.length > 0);
  } catch {
    return [];
  }
}

function makeOrderNumber(): string {
  return Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join(
    "",
  );
}

/**
 * Places an order. Prices are re-read from the catalogue on the server —
 * the client only sends slugs and quantities, never money.
 */
export async function placeOrder(formData: FormData): Promise<PlaceOrderResult> {
  const shipping = readShipping(formData);
  const lines = parseLines(String(formData.get("lines") ?? "[]"));

  if (lines.length === 0) return { ok: false, error: "Votre panier est vide." };

  const fieldErrors: Record<string, string> = {};
  for (const [field, message] of REQUIRED_FIELDS) {
    if (!shipping[field]) fieldErrors[field] = message;
  }
  if (shipping.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(shipping.email)) {
    fieldErrors.email = "Cet e-mail ne semble pas valide";
  }

  // Intigo requires phone1 with at least 8 digits, so an order without a usable
  // number cannot be shipped at all — reject it here rather than at the counter.
  const phone = normalisePhone(shipping.phone);
  if (!shipping.phone) fieldErrors.phone = "Le téléphone est obligatoire";
  else if (!phone) fieldErrors.phone = "Ce numéro tunisien ne semble pas valide";

  if (!shipping.district) fieldErrors.district = "Choisissez une délégation";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Vérifiez les champs en surbrillance.", fieldErrors };
  }

  // Non-null: the checks above return early when the number is missing or
  // unparseable. Storing the normalised form is what Intigo accepts.
  shipping.phone = phone as string;

  const supabase = await getSupabaseServerClient();

  // Authoritative prices: from Postgres when configured, otherwise the demo catalogue.
  const slugs = lines.map((l) => l.slug);
  const priced = supabase
    ? ((
        await supabase
          .from("products")
          .select("id, slug, name, price_cents, currency, images, offers")
          .in("slug", slugs)
          .eq("is_active", true)
      ).data ?? [])
    : fallbackProducts
        .filter((p) => slugs.includes(p.slug))
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price_cents: p.price_cents,
          currency: p.currency,
          images: p.images,
          offers: p.offers,
        }));

  const productIdBySlug = new Map(priced.map((p) => [p.slug, p.id]));

  const items = lines
    .map((line) => {
      const product = priced.find((p) => p.slug === line.slug);
      if (!product) return null;
      // Offers are re-resolved server-side by name, for the same reason the
      // unit price is: a client may not name its own price.
      const offer = resolveOffer(product.offers, line.offerName);
      return {
        product_name: product.name,
        product_slug: product.slug,
        image: product.images?.[0] ?? null,
        size: line.size,
        color: line.color,
        offer_name: offer?.name ?? null,
        unit_cents: offer ? offer.price_cents : product.price_cents,
        quantity: line.quantity,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  if (items.length === 0) return { ok: false, error: "Ces produits ne sont plus disponibles." };

  const subtotal = items.reduce((sum, i) => sum + i.unit_cents * i.quantity, 0);
  const shippingCents = shippingFor(subtotal);
  const total = subtotal + shippingCents;
  const currency = priced[0]?.currency ?? "TND";

  const orderNumber = makeOrderNumber();

  if (supabase) {
    // Both keys are generated here rather than read back: anonymous shoppers
    // may insert an order but have no SELECT policy on it, and Postgres rejects
    // an INSERT ... RETURNING whose row the caller cannot see.
    const orderId = randomUUID();

    const { error } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        order_number: orderNumber,
        email: shipping.email,
        full_name: shipping.full_name,
        phone: shipping.phone || null,
        address_line1: shipping.address_line1,
        address_line2: shipping.address_line2 || null,
        city: shipping.city,
        district: shipping.district,
        postal_code: shipping.postal_code,
        country: shipping.country,
        note: shipping.note || null,
        subtotal_cents: subtotal,
        shipping_cents: shippingCents,
        total_cents: total,
        currency,
      });

    if (error) {
      console.error("[placeOrder] order insert failed:", error.message);
      return { ok: false, error: "We couldn't save that order. Please try again." };
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        ...item,
        order_id: orderId,
        product_id: productIdBySlug.get(item.product_slug) ?? null,
      })),
    );

    if (itemsError) {
      console.error("[placeOrder] item insert failed:", itemsError.message);
      // Roll back the header so we never keep an order with no lines. Deleting
      // needs the service role — anonymous shoppers can't delete their own row.
      const admin = getSupabaseAdminClient();
      if (admin) await admin.from("orders").delete().eq("id", orderId);
      return { ok: false, error: "We couldn't save that order. Please try again." };
    }

    // Ping the admin phones. Deliberately after the commit and never awaited
    // for correctness — a push failure must not fail a paid-for order.
    await notifyNewOrder({
      orderNumber,
      customer: shipping.full_name,
      totalCents: total,
      currency,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    LAST_ORDER_COOKIE,
    JSON.stringify({
      order_number: orderNumber,
      email: shipping.email,
      full_name: shipping.full_name,
      address_line1: shipping.address_line1,
      address_line2: shipping.address_line2 || null,
      city: shipping.city,
      postal_code: shipping.postal_code,
      country: shipping.country,
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: total,
      currency,
      items,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return { ok: true, orderNumber };
}

export type CodOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Cash on delivery, straight from the product page: one piece, a phone number
 * and an address. No account, no email, no card.
 *
 * Like `placeOrder`, the price is read from the catalogue on the server — the
 * form only says which piece, which variant and how many.
 */
export async function placeCodOrder(formData: FormData): Promise<CodOrderResult> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const slug = get("slug");
  const quantity = Math.max(1, Math.min(20, Number(get("quantity")) || 1));
  const size = get("size") || null;
  const color = get("color") || null;
  const offerName = get("offer_name") || null;
  const district = get("district") || null;

  const fullName = get("full_name");
  const rawPhone = get("phone");
  const governorate = get("governorate");
  const address = get("address_line1");
  const note = get("note");

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.full_name = "Le nom est obligatoire";

  const phone = normalisePhone(rawPhone);
  if (!rawPhone) fieldErrors.phone = "Le téléphone est obligatoire";
  else if (!phone) fieldErrors.phone = "Ce numéro tunisien ne semble pas valide";

  // Accept either Intigo's spelling or our bundled one — the form uses Intigo's
  // list when reachable and falls back to ours when it is not.
  const fold = (value: string) =>
    value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const knownGouvernorat =
    governorate.length > 0 &&
    (GOVERNORATES.some((g) => fold(g) === fold(governorate)) || governorate.length <= 40);
  if (!knownGouvernorat) {
    fieldErrors.governorate = "Choisissez un gouvernorat";
  }
  if (!address) fieldErrors.address_line1 = "L'adresse est obligatoire";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Vérifiez les champs en surbrillance.", fieldErrors };
  }

  const supabase = await getSupabaseServerClient();

  const product = supabase
    ? (
        await supabase
          .from("products")
          .select("id, slug, name, price_cents, currency, images, offers")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle()
      ).data
    : (fallbackProducts.find((p) => p.slug === slug) ?? null);

  if (!product) return { ok: false, error: "Ce produit n'est plus disponible." };

  const codOffer = resolveOffer(product.offers, offerName);
  const codUnitCents = codOffer ? codOffer.price_cents : product.price_cents;

  const subtotal = codUnitCents * quantity;
  const shippingCents = shippingFor(subtotal);
  const total = subtotal + shippingCents;
  const currency = product.currency ?? "TND";
  const orderNumber = makeOrderNumber();

  const item = {
    product_name: product.name,
    product_slug: product.slug,
    image: product.images?.[0] ?? null,
    size,
    color,
    offer_name: codOffer?.name ?? null,
    unit_cents: codUnitCents,
    quantity,
  };

  if (supabase) {
    const orderId = randomUUID();

    const { error } = await supabase.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      email: null,
      full_name: fullName,
      phone,
      address_line1: address,
      city: governorate,
      district,
      postal_code: "-",
      country: "Tunisia",
      note: note || null,
      payment_method: "cod",
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: total,
      currency,
    });

    if (error) {
      console.error("[placeCodOrder] insert failed:", error.message);
      return { ok: false, error: "We couldn't save that order. Please try again." };
    }

    const { error: itemError } = await supabase
      .from("order_items")
      .insert({ ...item, order_id: orderId, product_id: product.id });

    if (itemError) {
      console.error("[placeCodOrder] item insert failed:", itemError.message);
      const admin = getSupabaseAdminClient();
      if (admin) await admin.from("orders").delete().eq("id", orderId);
      return { ok: false, error: "We couldn't save that order. Please try again." };
    }

    await notifyNewOrder({
      orderNumber,
      customer: `${fullName} (COD)`,
      totalCents: total,
      currency,
      itemCount: quantity,
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    LAST_ORDER_COOKIE,
    JSON.stringify({
      order_number: orderNumber,
      email: "",
      full_name: fullName,
      address_line1: address,
      address_line2: null,
      city: governorate,
      district,
      postal_code: "-",
      country: "Tunisia",
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: total,
      currency,
      items: [item],
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return { ok: true, orderNumber };
}
