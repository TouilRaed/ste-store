"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { PillButton } from "@/components/ui";
import { useCart } from "@/lib/cart/cart-context";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const images = product.images.length > 0 ? product.images : [null];

  return (
    <div className="flex flex-col gap-4">
      <div className="bezel lift rounded-[2.5rem] p-2 ring-1 ring-[color:var(--line)]">
        <div className="bezel-core relative aspect-[4/5] overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-paper-deep">
          {images.map((src, i) => (
            <div
              key={`${src ?? "blank"}-${i}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            >
              <ProductImage
                src={src}
                alt={i === 0 ? product.name : ""}
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-24 w-20 overflow-hidden rounded-2xl ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                i === active ? "ring-ink" : "ring-[color:var(--line)] opacity-60 hover:opacity-100"
              }`}
            >
              <ProductImage src={src} alt="" sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Size, colour and offer, chosen once and shared by both ways to buy. */
export function ProductOptions({
  product,
  size,
  color,
  offerIndex,
  onSize,
  onColor,
  onOffer,
}: {
  product: Product;
  size: string | null;
  color: string | null;
  offerIndex: number | null;
  onSize: (value: string) => void;
  onColor: (value: string) => void;
  onOffer: (value: number | null) => void;
}) {
  const offers = product.offers ?? [];

  return (
    <div className="mt-10">
      {offers.length > 0 ? (
        <fieldset className="mb-8">
          <legend className="eyebrow text-ink-muted">Offres</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOffer(null)}
              className={`rounded-full border px-4 py-2 text-[15px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                offerIndex === null
                  ? "border-transparent bg-accent text-white"
                  : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
              }`}
            >
              Prix unitaire — {formatMoney(product.price_cents, product.currency)}
            </button>
            {offers.map((offer, index) => (
              <button
                key={`${offer.name}-${index}`}
                type="button"
                onClick={() => onOffer(index)}
                className={`rounded-full border px-4 py-2 text-[15px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                  offerIndex === index
                    ? "border-transparent bg-accent text-white"
                    : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
                }`}
              >
                {offer.name} — {formatMoney(offer.price_cents, product.currency)}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      {product.sizes.length > 0 ? (
        <fieldset>
          <legend className="eyebrow text-ink-muted">Taille</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSize(s)}
                className={`min-w-[3.25rem] rounded-full border px-4 py-2 text-[15px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                  size === s
                    ? "border-transparent bg-accent text-white"
                    : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {product.colors.length > 0 ? (
        <fieldset className="mt-8">
          <legend className="eyebrow text-ink-muted">Couleur</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColor(c)}
                className={`rounded-full border px-4 py-2 text-[15px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                  color === c
                    ? "border-transparent bg-accent text-white"
                    : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

    </div>
  );
}

/**
 * Quantity and the cart button. The selection is owned by ProductBuyPanel so
 * the shopper picks an offer once, not once per purchase path.
 */
export function AddToCart({
  product,
  size,
  color,
  offerIndex,
}: {
  product: Product;
  size: string | null;
  color: string | null;
  offerIndex: number | null;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  const offers = product.offers ?? [];
  const selectedOffer = offerIndex === null ? null : (offers[offerIndex] ?? null);
  const unitCents = selectedOffer ? selectedOffer.price_cents : product.price_cents;

  const soldOut = product.stock <= 0;
  const max = Math.max(1, Math.min(product.stock, 8));

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-[color:var(--line-strong)] bg-white/60 p-1">
          <button
            type="button"
            aria-label="Diminuer la quantité"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-8 w-8 rounded-full text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep"
          >
            −
          </button>
          <span className="w-6 text-center text-base tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Augmenter la quantité"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            className="h-8 w-8 rounded-full text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep"
          >
            +
          </button>
        </div>

        <PillButton
          disabled={soldOut}
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images[0] ?? null,
              size,
              color,
              offerName: selectedOffer?.name ?? null,
              unitCents,
              quantity,
            })
          }
          className="min-w-[15rem] flex-1"
        >
          {soldOut ? "Épuisé" : `Ajouter au panier — ${formatMoney(unitCents * quantity, product.currency)}`}
        </PillButton>
      </div>

      <p className="mt-5 text-sm text-ink-muted">
        {soldOut
          ? "Épuisé pour le moment."
          : `${product.stock} en stock · paiement à la livraison partout en Tunisie`}
      </p>
    </div>
  );
}
