"use client";

import { useEffect } from "react";
import { CodOrderForm } from "@/components/cod-order-form";
import { ProductOptions } from "@/components/product-purchase";
import { trackPixel } from "@/lib/meta/pixel";
import type { Product } from "@/lib/types";

/**
 * Right-hand column of the product page: the option groups, then the order
 * card.
 *
 * The choice itself lives in ProductSelectionProvider, one level up, because
 * the gallery in the other column has to follow it.
 */
export function ProductBuyPanel({ product }: { product: Product }) {
  // One ViewContent per product page. This panel is the only client component
  // on the page that already has the product, so it carries the event.
  useEffect(() => {
    trackPixel("ViewContent", {
      contents: [{ id: product.slug, quantity: 1, unitCents: product.price_cents }],
      valueCents: product.price_cents,
      currency: product.currency,
    });
  }, [product.slug, product.price_cents, product.currency]);

  return (
    <div>
      <ProductOptions product={product} />

      <div className="mt-8">
        <CodOrderForm product={product} />
      </div>
    </div>
  );
}
