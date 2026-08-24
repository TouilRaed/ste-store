import type { Product } from "@/lib/types";

export type Badge = {
  label: string;
  /** ink = solid dark, accent = warm highlight, paper = light on image */
  tone: "ink" | "accent" | "paper";
};

/** Stock level under which the shop starts nudging ("plus que 3"). */
export const LOW_STOCK_AT = 8;

/**
 * Badges for a product, in priority order: the shop's own tags first, then the
 * ones derived from stock and price so they can never contradict the data.
 */
export function badgesFor(product: Product): Badge[] {
  const badges: Badge[] = [];

  if (product.stock <= 0) {
    return [{ label: "Épuisé", tone: "ink" }];
  }

  for (const tag of product.tags ?? []) {
    badges.push({ label: tag, tone: "paper" });
  }

  if (product.compare_at_cents != null && product.compare_at_cents > product.price_cents) {
    const off = Math.round((1 - product.price_cents / product.compare_at_cents) * 100);
    badges.push({ label: off >= 5 ? `Promo −${off}%` : "Promo", tone: "accent" });
  }

  return badges;
}

/** The "only N left" nudge, or null when there's plenty. */
export function stockNote(product: Product): string | null {
  if (product.stock <= 0) return null;
  if (product.stock > LOW_STOCK_AT) return null;
  return product.stock === 1 ? "Dernière pièce" : `Plus que ${product.stock}`;
}
