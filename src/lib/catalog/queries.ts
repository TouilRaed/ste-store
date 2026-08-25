import "server-only";

import { fallbackCollections, fallbackProducts } from "@/lib/catalog/fallback";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Collection, Product } from "@/lib/types";

const PRODUCT_COLUMNS =
  "id, slug, name, description, details, price_cents, compare_at_cents, currency, images, sizes, colors, collection_id, gender, stock, is_featured, tags, offers";

export type ProductFilters = {
  collection?: string;
  gender?: string;
  sort?: "new" | "price-asc" | "price-desc";
  search?: string;
};

function sortLocally(list: Product[], sort: ProductFilters["sort"]): Product[] {
  const sorted = [...list];
  if (sort === "price-asc") sorted.sort((a, b) => a.price_cents - b.price_cents);
  else if (sort === "price-desc") sorted.sort((a, b) => b.price_cents - a.price_cents);
  return sorted;
}

function filterFallback(filters: ProductFilters): Product[] {
  const collectionId = filters.collection
    ? fallbackCollections.find((c) => c.slug === filters.collection)?.id
    : undefined;

  const search = filters.search?.trim().toLowerCase();

  const list = fallbackProducts.filter((p) => {
    if (collectionId && p.collection_id !== collectionId) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (search && !`${p.name} ${p.description}`.toLowerCase().includes(search)) return false;
    return true;
  });

  return sortLocally(list, filters.sort);
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fallbackCollections;

  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, name, tagline, position")
    .order("position", { ascending: true });

  if (error || !data?.length) return fallbackCollections;
  return data as Collection[];
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return filterFallback(filters);

  let query = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true);

  if (filters.collection) {
    const collections = await getCollections();
    const match = collections.find((c) => c.slug === filters.collection);
    if (match) query = query.eq("collection_id", match.id);
  }
  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.search?.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);

  if (filters.sort === "price-asc") query = query.order("price_cents", { ascending: true });
  else if (filters.sort === "price-desc") query = query.order("price_cents", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error || !data?.length) return filterFallback(filters);
  return data as unknown as Product[];
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fallbackProducts.filter((p) => p.is_featured).slice(0, limit);

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(limit);

  if (error || !data?.length) return fallbackProducts.filter((p) => p.is_featured).slice(0, limit);
  return data as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fallbackProducts.find((p) => p.slug === slug) ?? null;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return fallbackProducts.find((p) => p.slug === slug) ?? null;
  return data as unknown as Product;
}

/**
 * Same category first. A category with only one or two pieces would otherwise
 * leave a near-empty row, so it tops up with the same cut, then anything else.
 */
export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const all = (await getProducts({})).filter((p) => p.id !== product.id && p.stock > 0);

  const picked: Product[] = [];
  const take = (candidates: Product[]) => {
    for (const candidate of candidates) {
      if (picked.length >= limit) return;
      if (!picked.some((p) => p.id === candidate.id)) picked.push(candidate);
    }
  };

  take(all.filter((p) => p.collection_id === product.collection_id));
  take(all.filter((p) => p.gender === product.gender));
  take(all);

  return picked;
}
