"use client";

import { useState } from "react";
import { CodOrderForm } from "@/components/cod-order-form";
import { AddToCart, ProductOptions } from "@/components/product-purchase";
import type { Product } from "@/lib/types";

/**
 * Owns the shopper's choice of size, colour and offer for the whole product
 * page.
 *
 * The picker itself is rendered once, inside the commande (checkout) block —
 * not repeated above the cart button too. It used to appear twice, which let
 * a shopper pick "3 lampes" in one copy and still order at the unit price in
 * the other; sharing one piece of state instead of one rendered picker would
 * have fixed the disagreement but not the redundant UI.
 */
export function ProductBuyPanel({ product }: { product: Product }) {
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors[0] ?? null);
  // null = the base price; otherwise the index of the chosen offer.
  const [offerIndex, setOfferIndex] = useState<number | null>(null);

  return (
    <div>
      <AddToCart product={product} size={size} color={color} offerIndex={offerIndex} />

      <ProductOptions
        product={product}
        size={size}
        color={color}
        offerIndex={offerIndex}
        onSize={setSize}
        onColor={setColor}
        onOffer={setOfferIndex}
      />

      <div className="mt-8">
        <CodOrderForm product={product} size={size} color={color} offerIndex={offerIndex} />
      </div>
    </div>
  );
}
