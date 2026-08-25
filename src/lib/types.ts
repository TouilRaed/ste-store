export type Collection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  position: number;
};

/** An alternative way to buy a product, e.g. { name: "3 pièces", price_cents: 120000 }. */
export type ProductOffer = {
  name: string;
  /** Minor units of the product's own currency, like every other price. */
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
  tags: string[];
  offers: ProductOffer[];
};

export type CartLine = {
  /** `${productId}:${size}:${color}:${offerName}` — one line per variant. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  /** Chosen offer, or null when bought at the base price. */
  offerName: string | null;
  unitCents: number;
  quantity: number;
};

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
  /** Délégation — required by Intigo, chosen from their list. */
  district?: string | null;
  postal_code: string;
  country: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: string;
  /** Carrier handoff. Null until the order is given to Intigo. */
  carrier?: string | null;
  tracking_code?: string | null;
  shipped_at?: string | null;
  created_at: string;
  order_items?: OrderItem[];
};
