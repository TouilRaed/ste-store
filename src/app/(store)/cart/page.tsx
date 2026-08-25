"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { Eyebrow, PillLink } from "@/components/ui";
import { useCart } from "@/lib/cart/cart-context";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { lines, setQuantity, remove, subtotalCents, shippingCents, totalCents, hydrated, count } = useCart();

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-32 pb-24 text-center md:pt-48">
        <Eyebrow>Votre panier</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
          Nothing in here yet
        </h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-soft">
          Twelve pieces are cut and ready. Start with the one you would wear tomorrow.
        </p>
        <div className="mt-10">
          <PillLink href="/shop">Voir la série</PillLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:px-8 md:pt-28">
      <Reveal>
        <Eyebrow>{hydrated ? `${count} ${count === 1 ? "pièce" : "pièces"}` : "Chargement"}</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
          Your bag
        </h1>
      </Reveal>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* Lines */}
        <Reveal className="flex flex-col gap-4">
          {lines.map((line) => (
            <div key={line.key} className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
              <div className="bezel-core flex gap-5 rounded-[calc(2rem-0.375rem)] bg-white p-4 sm:p-5">
                <Link
                  href={`/product/${line.slug}`}
                  className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-paper-deep sm:h-40 sm:w-32"
                >
                  <ProductImage src={line.image} alt={line.name} sizes="128px" className="object-cover" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/product/${line.slug}`} className="font-display block text-lg leading-tight">
                        {line.name}
                      </Link>
                      <p className="eyebrow mt-2 text-ink-muted">
                        {[line.size, line.color].filter(Boolean).join(" · ") || "Taille unique"}
                      </p>
                    </div>
                    <p className="shrink-0 text-base tabular-nums">
                      {formatMoney(line.unitCents * line.quantity)}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 rounded-full border border-[color:var(--line-strong)] bg-white/60 p-1">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        className="h-8 w-8 rounded-full text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-base tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        className="h-8 w-8 rounded-full text-ink-soft transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.key)}
                      className="text-sm text-ink-muted underline underline-offset-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Reveal>

        {/* Summary */}
        <Reveal delay={120} className="lg:sticky lg:top-28">
          <div className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
            <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white p-6">
              <p className="eyebrow text-ink-muted">Récapitulatif</p>

              <dl className="mt-6 space-y-3 text-base">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Sous-total</dt>
                  <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Livraison</dt>
                  <dd className="tabular-nums">
                    {shippingCents === 0 ? "Offerte" : formatMoney(shippingCents)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex items-baseline justify-between border-t border-[color:var(--line)] pt-6">
                <span className="font-display text-lg">Total</span>
                <span className="font-display text-2xl tabular-nums">{formatMoney(totalCents)}</span>
              </div>

              <p className="mt-6 text-sm text-ink-muted">
                Livraison 8 DT partout en Tunisie, payée à la réception.
              </p>

              <div className="mt-8">
                <PillLink href="/checkout" className="w-full justify-between">
                  Checkout
                </PillLink>
              </div>

              <Link
                href="/shop"
                className="mt-5 block text-center text-sm text-ink-muted underline underline-offset-4"
              >
                Keep browsing
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
