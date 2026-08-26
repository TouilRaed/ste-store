"use client";

import { useState } from "react";
import { CodOrderForm } from "@/components/cod-order-form";
import { AddToCart, ProductOptions } from "@/components/product-purchase";
import type { Product } from "@/lib/types";

/**
 * Owns the shopper's choice of size, colour and offer for the whole product
 * page.
 *
 * The cart button and the cash-on-delivery form used to keep their own copies,
 * so the selectors appeared twice and could disagree — a shopper could pick
 * "3 lampes" beside the cart button and still order at the unit price below.
 */
export function ProductBuyPanel({ product }: { product: Product }) {
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors[0] ?? null);
  // null = the base price; otherwise the index of the chosen offer.
  const [offerIndex, setOfferIndex] = useState<number | null>(null);

  return (
    <div>
      <ProductOptions
        product={product}
        size={size}
        color={color}
        offerIndex={offerIndex}
        onSize={setSize}
        onColor={setColor}
        onOffer={setOfferIndex}
      />

      <AddToCart product={product} size={size} color={color} offerIndex={offerIndex} />

      <div className="mt-10">
        <CodOrderForm product={product} size={size} color={color} offerIndex={offerIndex} />
      </div>
    </div>
  );
}
