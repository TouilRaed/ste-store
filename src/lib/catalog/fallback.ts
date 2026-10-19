import type { Collection, Product } from "@/lib/types";

/**
 * Mirror of `supabase/seed.sql`. Used only while Supabase credentials are
 * missing, so `npm run dev` renders the storefront on a clean clone.
 * Once the env vars are set, every query reads from Postgres instead.
 *
 * Categories are the shop's own: home decoration. The catalogue itself is
 * empty — products are added through /meddm.
 */

export const fallbackCollections: Collection[] = [
  { id: "col-deco-murale", slug: "decoration-murale", name: "Décoration murale", tagline: "Cadres, miroirs et affiches.", position: 1 },
  { id: "col-luminaires", slug: "luminaires", name: "Luminaires", tagline: "Lampes, guirlandes et appliques.", position: 2 },
  { id: "col-cuisine-table", slug: "cuisine-table", name: "Cuisine & table", tagline: "Vaisselle, ustensiles et art de la table.", position: 3 },
  { id: "col-textile", slug: "textile-tapis", name: "Textile & tapis", tagline: "Coussins, plaids et tapis.", position: 4 },
  { id: "col-rangement", slug: "rangement", name: "Rangement", tagline: "Paniers, étagères et boîtes.", position: 5 },
];

export const fallbackProducts: Product[] = [];
