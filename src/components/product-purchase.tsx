"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { useProductSelection } from "@/components/product-selection";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const { spotlight } = useProductSelection();
  const images = product.images.length > 0 ? product.images : [null];
  const [active, setActive] = useState(0);

  // A chosen option's photo wins over the thumbnail strip: the shopper just
  // asked to see that variant. Clicking a thumbnail afterwards still works,
  // because picking an option is what sets the spotlight in the first place.
  const shown = spotlight ?? images[active] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bezel lift rounded-[2.5rem] p-2 ring-1 ring-[color:var(--line)]">
        <div className="bezel-core relative aspect-[4/5] overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-paper-deep">
          <div key={shown ?? "blank"} className="absolute inset-0 animate-[fade-in_0.5s_ease]">
            <ProductImage
              src={shown}
              alt={product.name}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Voir la photo ${i + 1}`}
              aria-current={src === shown}
              className={`relative h-24 w-20 overflow-hidden rounded-2xl ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                src === shown ? "ring-ink" : "ring-[color:var(--line)] opacity-60 hover:opacity-100"
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

const chipClass = (activeChip: boolean) =>
  `flex items-center gap-2 rounded-full border py-2 pr-4 text-[15px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
    activeChip
      ? "border-transparent bg-accent text-white"
      : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
  }`;

/**
 * Offers, then every option group the product defines.
 *
 * A choice that carries a photo shows it as a thumbnail in its own chip, so
 * the variants can be browsed by eye before being clicked — which is the
 * point of giving them pictures at all.
 */
export function ProductOptions({ product }: { product: Product }) {
  const { picked, offerIndex, choose, chooseOffer } = useProductSelection();
  const offers = product.offers ?? [];
  const groups = product.option_groups ?? [];

  if (offers.length === 0 && groups.length === 0) return null;

  return (
    <div className="mt-10">
      {offers.length > 0 ? (
        <fieldset className="mb-8">
          <legend className="eyebrow text-ink-muted">Offres</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => chooseOffer(null)} className={`${chipClass(offerIndex === null)} pl-4`}>
              Prix unitaire — {formatMoney(product.price_cents, product.currency)}
            </button>
            {offers.map((offer, index) => (
              <button
                key={`${offer.name}-${index}`}
                type="button"
                onClick={() => chooseOffer(index)}
                className={`${chipClass(offerIndex === index)} pl-4`}
              >
                {offer.name} — {formatMoney(offer.price_cents, product.currency)}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {groups.map((group) => (
        <fieldset key={group.label} className="mt-8 first:mt-0">
          <legend className="eyebrow text-ink-muted">{group.label}</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.choices.map((choice) => {
              const isActive = picked[group.label] === choice.name;
              return (
                <button
                  key={choice.name}
                  type="button"
                  onClick={() => choose(group.label, choice.name)}
                  aria-pressed={isActive}
                  className={`${chipClass(isActive)} ${choice.image ? "py-1 pl-1" : "pl-4"}`}
                >
                  {choice.image ? (
                    <span className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-black/10">
                      <ProductImage src={choice.image} alt="" sizes="32px" className="object-cover" />
                    </span>
                  ) : null}
                  {choice.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
