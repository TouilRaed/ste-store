import { z } from "zod";

/**
 * The shop's real workflow. "paid" is gone: nothing is paid before delivery in
 * a cash-on-delivery shop, so the status never meant anything here.
 *
 * `shipped` and `delivered` are not set by hand — the first comes from booking
 * the parcel with Intigo, the second from the delivery itself.
 */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
] as const;

/** The ones an operator sets manually, in workflow order. */
export const SETTABLE_ORDER_STATUSES = ["pending", "confirmed", "ready", "cancelled"] as const;

/**
 * Display labels. The stored values stay English — a Postgres CHECK constraint
 * pins them, and Intigo/mobile both read them — so only the UI is translated.
 */
export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  ready: "Prêt à expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulé",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as (typeof ORDER_STATUSES)[number]] ?? status;
}
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

/** Accepts a textarea of one-per-line values or a real array. */
const lines = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split("\n"))
      .map((v) => v.trim())
      .filter((v) => v.length > 0),
  );

/** Empty form fields arrive as "" — normalise those to null before parsing. */
const blankToNull = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : value;

const optionalCents = z.preprocess(
  blankToNull,
  z.coerce.number().int().min(0).max(100_000_000).nullable(),
);

const optionalUuid = z.preprocess(blankToNull, z.uuid().nullable());

/**
 * Offers arrive two ways: the web form posts a JSON string from a hidden
 * field, the mobile app sends a real array. Anything unparseable falls through
 * as a string and fails the array check rather than silently becoming [].
 */
const offerList = z
  .preprocess(
    (value) => {
      if (typeof value !== "string") return value ?? [];
      const raw = value.trim();
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    z
      .array(
        z.object({
          name: z.string().trim().min(1).max(80),
          price_cents: z.coerce.number().int().min(0).max(100_000_000),
        }),
      )
      .max(20),
  )
  .default([]);

export const productInputSchema = z.object({
  slug,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(""),
  details: lines.default([]),
  price_cents: z.coerce.number().int().min(0).max(100_000_000),
  compare_at_cents: optionalCents,
  currency: z.string().trim().length(3).toUpperCase().default("TND"),
  images: lines.default([]),
  sizes: lines.default([]),
  colors: lines.default([]),
  collection_id: optionalUuid,
  gender: z.enum(["women", "men", "unisex"]).default("unisex"),
  stock: z.coerce.number().int().min(0).max(100_000),
  tags: lines.default([]),
  is_featured: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
  offers: offerList,
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const productPatchSchema = productInputSchema.partial();

export const orderPatchSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

/** Everything an admin may edit on an existing order. All fields optional. */
export const orderUpdateSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    full_name: z.string().trim().min(1).max(120),
    email: z.email().max(200),
    phone: z.string().trim().max(40).nullable(),
    address_line1: z.string().trim().min(1).max(200),
    address_line2: z.string().trim().max(200).nullable(),
    city: z.string().trim().min(1).max(120),
    postal_code: z.string().trim().min(1).max(40),
    country: z.string().trim().min(1).max(120),
    note: z.string().trim().max(2000).nullable(),
    admin_note: z.string().trim().max(2000).nullable(),
  })
  .partial();

export type OrderPatch = z.infer<typeof orderUpdateSchema>;

export const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

/** One line on an order, as edited in the admin. */
export const orderItemSchema = z.object({
  product_slug: z.string().trim().min(1).max(120),
  product_name: z.string().trim().min(1).max(200),
  image: z.string().trim().max(600).nullable().optional(),
  size: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(60).nullable().optional(),
  unit_cents: z.coerce.number().int().min(0).max(100_000_000),
  quantity: z.coerce.number().int().min(1).max(100),
});

export const orderItemsSchema = z.object({
  items: z.array(orderItemSchema).min(1, "An order needs at least one piece"),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
