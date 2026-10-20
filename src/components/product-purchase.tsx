"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { useProductSelection } from "@/components/product-selection";
import { formatMoney } from "@/lib/format";
import type { Product, ProductOffer } from "@/lib/types";

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
 * What the same pieces would cost bought one at a time.
 *
 * An offer is named the way the shop sells it — « 2 pièces livraison
 * gratuite » — so the count is read from the name and measured against the
 * crossed-out price when the piece carries one. No count in the name means no
 * comparison: inventing a reference would be inventing a discount.
 */
function referenceCents(product: Product, offer: ProductOffer): number | null {
  const pieces = Number(offer.name.match(/\d+/)?.[0] ?? "");
  if (!Number.isFinite(pieces) || pieces < 2) return null;

  const unit =
    product.compare_at_cents && product.compare_at_cents > product.price_cents
      ? product.compare_at_cents
      : product.price_cents;
  const reference = unit * pieces;

  return reference > offer.price_cents ? reference : null;
}

/** One selectable offer: what it is on the left, what it costs on the right. */
function OfferRow({
  label,
  priceCents,
  referenceCents: reference,
  currency,
  selected,
  best,
  onSelect,
}: {
  label: string;
  priceCents: number;
  referenceCents: number | null;
  currency: string;
  selected: boolean;
  best?: boolean;
  onSelect: () => void;
}) {
  const saving = reference === null ? 0 : reference - priceCents;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] ${
        selected
          ? "border-accent bg-accent-soft"
          : "border-[color:var(--line-strong)] bg-white/60 hover:bg-white"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${
          selected ? "border-accent bg-accent" : "border-[color:var(--line-strong)] bg-white"
        }`}
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`text-[15px] ${selected ? "text-ink" : "text-ink-soft"}`}>{label}</span>
          {best ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium tracking-wide text-white">
              Meilleure offre
            </span>
          ) : null}
        </span>
        {saving > 0 ? (
          <span className="mt-1 block text-[13px] text-ink-muted">
            au lieu de <span className="line-through tabular-nums">{formatMoney(reference!, currency)}</span>
          </span>
        ) : null}
      </span>

      <span className="shrink-0 text-right">
        <span className="font-display block text-lg leading-none tabular-nums">
          {formatMoney(priceCents, currency)}
        </span>
        {saving > 0 ? (
          <span className="mt-1.5 block text-[13px] font-medium text-accent-deep tabular-nums">
            −{formatMoney(saving, currency)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

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

  // The pack that saves the most carries the badge. Nothing is marked when no
  // offer actually saves anything — a badge on every row says nothing.
  let bestOfferIndex = -1;
  let bestSaving = 0;
  offers.forEach((offer, index) => {
    const reference = referenceCents(product, offer);
    const saving = reference === null ? 0 : reference - offer.price_cents;
    if (saving > bestSaving) {
      bestSaving = saving;
      bestOfferIndex = index;
    }
  });

  if (offers.length === 0 && groups.length === 0) return null;

  return (
    <div className="mt-10">
      {offers.length > 0 ? (
        <fieldset className="mb-8">
          <legend className="eyebrow text-ink-muted">Offres</legend>
          {/* Rows, not pills: a pack and its price are two pieces of
              information, and the saving is a third. Side by side at the full
              width of the column they can be compared down one edge. */}
          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Offres">
            <OfferRow
              label="Prix unitaire"
              priceCents={product.price_cents}
              referenceCents={
                product.compare_at_cents && product.compare_at_cents > product.price_cents
                  ? product.compare_at_cents
                  : null
              }
              currency={product.currency}
              selected={offerIndex === null}
              onSelect={() => chooseOffer(null)}
            />
            {offers.map((offer, index) => (
              <OfferRow
                key={`${offer.name}-${index}`}
                label={offer.name}
                priceCents={offer.price_cents}
                referenceCents={referenceCents(product, offer)}
                currency={product.currency}
                selected={offerIndex === index}
                best={index === bestOfferIndex}
                onSelect={() => chooseOffer(index)}
              />
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
