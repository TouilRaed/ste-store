import type { Product } from "@/lib/types";

export type Badge = {
  label: string;
  /** ink = solid dark, accent = warm highlight, paper = light on image */
  tone: "ink" | "accent" | "paper";
};

/**
 * Badges for a product: the shop's own tags first, then the one derived from
 * price so it can never contradict the data.
 *
 * Nothing here reads stock any more. Every piece is made to order, so there is
 * no quantity to run out of and no "Épuisé" to show.
 */
export function badgesFor(product: Product): Badge[] {
  const badges: Badge[] = [];

  for (const tag of product.tags ?? []) {
    badges.push({ label: tag, tone: "paper" });
  }

  if (product.compare_at_cents != null && product.compare_at_cents > product.price_cents) {
    const off = Math.round((1 - product.price_cents / product.compare_at_cents) * 100);
    badges.push({ label: off >= 5 ? `Promo −${off}%` : "Promo", tone: "accent" });
  }

  return badges;
}
