/** Mirrors the payloads returned by /api/admin/* on the Next.js app. */

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Collection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  position: number;
};

/** Mirrors ProductOffer in src/lib/types.ts. */
export type ProductOffer = {
  name: string;
  /** Minor units of the product's own currency. */
  price_cents: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string[];
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  images: string[];
  sizes: string[];
  colors: string[];
  collection_id: string | null;
  gender: "women" | "men" | "unisex";
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  offers: ProductOffer[];
  created_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at">;

export type OrderItem = {
  product_name: string;
  product_slug: string;
  image: string | null;
  size: string | null;
  color: string | null;
  offer_name?: string | null;
  unit_cents: number;
  quantity: number;
};

export type Order = {
  id: string;
  order_number: string;
  email: string;
  full_name: string;
  phone?: string | null;
  note?: string | null;
  admin_note?: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
  order_items?: OrderItem[];
};

export type AdminStats = {
  orders: { total: number; pending: number; paid: number; shipped: number };
  revenueCents: number;
  currency: string;
  products: { total: number; active: number; lowStock: number };
  recentOrders: Order[];
};

/** Fields an admin may edit on an existing order. */
export type OrderPatch = Partial<{
  status: OrderStatus;
  full_name: string;
  email: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  note: string | null;
  admin_note: string | null;
}>;

/** One editable line on an order — what PUT /orders/:id/items expects. */
export type OrderItemInput = {
  product_slug: string;
  product_name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  offer_name?: string | null;
  unit_cents: number;
  quantity: number;
};
