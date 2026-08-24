import type { Collection, Product } from "@/lib/types";

/**
 * Mirror of `supabase/seed.sql`. Used only while Supabase credentials are
 * missing, so `npm run dev` renders a full storefront on a clean clone.
 * Once the env vars are set, every query reads from Postgres instead.
 */

export const fallbackCollections: Collection[] = [
  { id: "col-atelier", slug: "atelier", name: "Atelier", tagline: "Tailored pieces cut in small runs.", position: 1 },
  { id: "col-everyday", slug: "everyday", name: "Everyday", tagline: "The quiet essentials you reach for first.", position: 2 },
  { id: "col-outerwear", slug: "outerwear", name: "Outerwear", tagline: "Weight, drape, and weather.", position: 3 },
  { id: "col-knitwear", slug: "knitwear", name: "Knitwear", tagline: "Slow yarns, long winters.", position: 4 },
];

export const fallbackProducts: Product[] = [];
