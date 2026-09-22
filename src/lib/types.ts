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

/** One pickable value inside a group, e.g. "Laiton" under "Couleur". */
export type ProductOptionChoice = {
  name: string;
  /** Shown in the gallery when this choice is picked; null keeps the default. */
  image: string | null;
};

/**
 * A way the product varies — "Couleur", "Type", "Modèle". Replaces the flat
 * `sizes`/`colors` arrays, which had nowhere to hold a picture.
 */
export type ProductOptionGroup = {
  label: string;
  choices: ProductOptionChoice[];
};

/** What a customer picked, carried on the cart line and copied onto the order. */
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
  stock: number;
  is_featured: boolean;
  tags: string[];
  offers: ProductOffer[];
};

export type CartLine = {
  /** productId + every chosen option + the offer — one line per variant. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  options: SelectedOption[];
  /** Chosen offer, or null when bought at the base price. */
  offerName: string | null;
  unitCents: number;
  quantity: number;
};

export type OrderItem = {
  product_name: string;
  product_slug: string;
  image: string | null;
  options?: SelectedOption[];
  /** Legacy columns, still populated on older orders. */
  size?: string | null;
  color?: string | null;
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
