/** Mirrors the payloads returned by /api/admin/* on the Next.js app. */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
] as const;

/** Mirrors SETTABLE_ORDER_STATUSES on the web — "ready" is not a button here either. */
export const SETTABLE_ORDER_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Mirrors ORDER_STATUS_LABELS on the web. Stored values stay English. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  ready: "Prêt à expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulé",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

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

/** One pickable value inside a group, e.g. "Laiton" under "Couleur". */
export type ProductOptionChoice = {
  name: string;
  /** Shown in the storefront gallery when this choice is picked. */
  image: string | null;
};

/** A way the product varies — "Couleur", "Type", "Modèle". */
export type ProductOptionGroup = {
  label: string;
  choices: ProductOptionChoice[];
};

/** What a customer picked, copied onto the order line. */
export type SelectedOption = {
  label: string;
  value: string;
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
  /** Legacy, kept for orders placed before option groups existed. */
  sizes: string[];
  colors: string[];
  option_groups: ProductOptionGroup[];
  collection_id: string | null;
  gender: "women" | "men" | "unisex";
  /**
   * Still on the row, read by nothing. Quantity is unlimited — pieces are made
   * to order — so the API fills this in and no screen asks about it.
   */
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  offers: ProductOffer[];
  created_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at" | "stock">;

export type OrderItem = {
  product_name: string;
  product_slug: string;
  image: string | null;
  options?: SelectedOption[];
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
  /** Délégation — required by Intigo, chosen from their list. */
  district?: string | null;
  postal_code: string;
  country: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  /** Carrier handoff. Null until the order is given to Intigo. */
  carrier?: string | null;
  tracking_code?: string | null;
  shipped_at?: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export type AdminStats = {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    ready: number;
    shipped: number;
  };
  revenueCents: number;
  currency: string;
  products: { total: number; active: number };
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
  /** Carried through untouched: saving a line must not erase the choice. */
  options?: SelectedOption[];
  size: string | null;
  color: string | null;
  offer_name?: string | null;
  unit_cents: number;
  quantity: number;
};
