import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { OrderItemInput, OrderPatch, OrderStatus, ProductInput } from "@/lib/admin/schemas";
import { shippingFor } from "@/lib/format";
import type { Collection, Order, Product } from "@/lib/types";

export class AdminError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AdminProduct = Product & { is_active: boolean; created_at: string };

const PRODUCT_COLUMNS =
  "id, slug, name, description, details, price_cents, compare_at_cents, currency, images, sizes, colors, collection_id, gender, stock, is_featured, is_active, tags, offers, created_at";

const ORDER_COLUMNS =
  "id, order_number, email, full_name, phone, address_line1, address_line2, city, district, postal_code, country, note, admin_note, subtotal_cents, shipping_cents, total_cents, currency, status, carrier, tracking_code, shipped_at, created_at";

/** Every admin read/write goes through the service role, so RLS never applies. */
function client() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new AdminError(
      503,
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return admin;
}

export function isAdminDataReady(): boolean {
  return getSupabaseAdminClient() !== null;
}

// --- Products ---------------------------------------------------------------

export async function listProducts(filters: { search?: string; active?: boolean } = {}): Promise<
  AdminProduct[]
> {
  let query = client().from("products").select(PRODUCT_COLUMNS).order("created_at", { ascending: false });

  if (filters.search?.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);
  if (filters.active !== undefined) query = query.eq("is_active", filters.active);

  const { data, error } = await query;
  if (error) throw new AdminError(500, error.message);
  return (data ?? []) as unknown as AdminProduct[];
}

export async function getProduct(id: string): Promise<AdminProduct> {
  const { data, error } = await client().from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new AdminError(500, error.message);
  if (!data) throw new AdminError(404, "Product not found");
  return data as unknown as AdminProduct;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const { data, error } = await client().from("products").insert(input).select(PRODUCT_COLUMNS).single();
  if (error) throw new AdminError(error.code === "23505" ? 409 : 500, error.message);
  return data as unknown as AdminProduct;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<AdminProduct> {
  if (Object.keys(patch).length === 0) return getProduct(id);
  const { data, error } = await client()
    .from("products")
    .update(patch)
    .eq("id", id)
    .select(PRODUCT_COLUMNS)
    .maybeSingle();
  if (error) throw new AdminError(error.code === "23505" ? 409 : 500, error.message);
  if (!data) throw new AdminError(404, "Product not found");
  return data as unknown as AdminProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await client().from("products").delete().eq("id", id);
  if (error) throw new AdminError(500, error.message);
}

export async function listCollections(): Promise<Collection[]> {
  const { data, error } = await client()
    .from("collections")
    .select("id, slug, name, tagline, position")
    .order("position", { ascending: true });
  if (error) throw new AdminError(500, error.message);
  return (data ?? []) as Collection[];
}

// --- Orders -----------------------------------------------------------------

export async function listOrders(filters: { status?: OrderStatus; search?: string } = {}): Promise<Order[]> {
  let query = client()
    .from("orders")
    .select(`${ORDER_COLUMNS}, order_items(product_name, product_slug, image, size, color, offer_name, unit_cents, quantity)`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`order_number.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new AdminError(500, error.message);
  return (data ?? []) as unknown as Order[];
}

export async function getOrder(id: string): Promise<Order> {
  const { data, error } = await client()
    .from("orders")
    .select(`${ORDER_COLUMNS}, order_items(product_name, product_slug, image, size, color, offer_name, unit_cents, quantity)`)
    .or(`id.eq.${id},order_number.eq.${id}`)
    .maybeSingle();
  if (error) throw new AdminError(500, error.message);
  if (!data) throw new AdminError(404, "Order not found");
  return data as unknown as Order;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return updateOrder(id, { status });
}

/** Records a successful carrier handoff and moves the order to `shipped`. */
export async function markShipped(
  id: string,
  carrier: string,
  trackingCode: string,
): Promise<Order> {
  const { data, error } = await client()
    .from("orders")
    .update({
      carrier,
      tracking_code: trackingCode,
      shipped_at: new Date().toISOString(),
      status: "shipped",
    })
    .eq("id", id)
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error) throw new AdminError(500, error.message);
  if (!data) throw new AdminError(404, "Commande introuvable");
  return data as unknown as Order;
}

/** Patches status, contact details, shipping address or either note. */
export async function updateOrder(id: string, patch: OrderPatch): Promise<Order> {
  if (Object.keys(patch).length === 0) return getOrder(id);

  const { data, error } = await client()
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error) throw new AdminError(500, error.message);
  if (!data) throw new AdminError(404, "Order not found");
  return data as unknown as Order;
}

// --- Dashboard --------------------------------------------------------------

export type AdminStats = {
  orders: { total: number; pending: number; paid: number; shipped: number };
  revenueCents: number;
  currency: string;
  products: { total: number; active: number; lowStock: number };
  recentOrders: Order[];
};

export async function getStats(): Promise<AdminStats> {
  const [orders, products] = await Promise.all([
    listOrders(),
    listProducts(),
  ]);

  const counted = (status: OrderStatus) => orders.filter((o) => o.status === status).length;

  return {
    orders: {
      total: orders.length,
      pending: counted("pending"),
      paid: counted("paid"),
      shipped: counted("shipped"),
    },
    // Cancelled orders never count toward revenue.
    revenueCents: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total_cents, 0),
    // TND, not USD: shipping is a flat 8000 minor units, which is 8 DT under
    // the three-decimal rule but $80 under two. The column defaults to TND.
    currency: orders[0]?.currency ?? "TND",
    products: {
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      lowStock: products.filter((p) => p.stock <= 8).length,
    },
    recentOrders: orders.slice(0, 6),
  };
}

/**
 * Replaces an order's lines and recomputes its money. Totals are always
 * derived here — never sent by the client — so the sum can't drift from the
 * lines it is supposed to add up.
 */
export async function setOrderItems(id: string, items: OrderItemInput[]): Promise<Order> {
  const order = await getOrder(id);
  const db = client();

  const subtotal = items.reduce((sum, item) => sum + item.unit_cents * item.quantity, 0);

  // The shipping rule is written in dinars. An order taken in another currency
  // (anything placed before the switch) keeps the shipping it was charged.
  const shipping = order.currency === "TND" ? shippingFor(subtotal) : order.shipping_cents;

  const { error: deleteError } = await db.from("order_items").delete().eq("order_id", order.id);
  if (deleteError) throw new AdminError(500, deleteError.message);

  const { error: insertError } = await db.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_slug: item.product_slug,
      product_name: item.product_name,
      image: item.image ?? null,
      size: item.size ?? null,
      color: item.color ?? null,
      unit_cents: item.unit_cents,
      quantity: item.quantity,
    })),
  );
  if (insertError) throw new AdminError(500, insertError.message);

  const { error: totalsError } = await db
    .from("orders")
    .update({
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: subtotal + shipping,
    })
    .eq("id", order.id);
  if (totalsError) throw new AdminError(500, totalsError.message);

  return getOrder(order.id);
}
