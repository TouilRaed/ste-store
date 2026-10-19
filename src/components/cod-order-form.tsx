"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { placeCodOrder, type CodOrderResult } from "@/app/actions/orders";
import { PillButton } from "@/components/ui";
import { MAX_QUANTITY, formatMoney, shippingFor } from "@/lib/format";
import { RegionSelect } from "@/components/region-select";
import { useCart } from "@/lib/cart/cart-context";
import { useProductSelection } from "@/components/product-selection";
import type { Product } from "@/lib/types";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[color:var(--line-strong)] bg-white/70 px-4 py-3 text-base outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

/**
 * Buy-now form for cash on delivery — the way most Tunisian shops sell. No
 * cart, no account: the piece, a phone number and an address.
 */
/**
 * Cash-on-delivery form. Size, colour and offer are chosen once in
 * ProductOptions above and passed in — rendering a second set of selectors
 * let a shopper pick "3 lampes" in one place and the unit price in the other.
 */
export function CodOrderForm({ product }: { product: Product }) {
  const { add } = useCart();
  const { options, offer: selectedOffer, unitCents, spotlight } = useProductSelection();
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState<CodOrderResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  const subtotal = unitCents * quantity;
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("slug", product.slug);
    formData.set("quantity", String(quantity));
    // Sent as one field: the server re-reads the product's own groups and
    // keeps only choices that still exist on it.
    formData.set("options", JSON.stringify(options));
    if (selectedOffer) formData.set("offer_name", selectedOffer.name);

    startTransition(async () => {
      const res = await placeCodOrder(formData);
      setResult(res);
      if (res.ok) router.push(`/order/${res.orderNumber}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
      <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-ink-muted">Commander — paiement à la livraison</p>
          <span className="eyebrow rounded-full bg-accent-soft px-3 py-1 text-accent-deep">COD</span>
        </div>

        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Vous payez le livreur à la réception. Aucune carte, aucun compte — laissez votre numéro et
          nous vous appelons pour confirmer.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="eyebrow text-ink-muted">Nom et prénom</span>
            <input name="full_name" autoComplete="name" disabled={pending} className={inputClass} />
            {fieldErrors.full_name ? (
              <span className="mt-2 block text-sm text-accent-deep">{fieldErrors.full_name}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="eyebrow text-ink-muted">Téléphone</span>
            <input
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="99 123 456"
              disabled={pending}
              className={inputClass}
            />
            {fieldErrors.phone ? (
              <span className="mt-2 block text-sm text-accent-deep">{fieldErrors.phone}</span>
            ) : null}
          </label>

          <RegionSelect
            className={inputClass}
            disabled={pending}
            governorateError={fieldErrors.governorate}
            districtError={fieldErrors.district}
          />

          <label className="block sm:col-span-2">
            <span className="eyebrow text-ink-muted">Adresse</span>
            <input
              name="address_line1"
              autoComplete="street-address"
              placeholder="Rue, immeuble, étage"
              disabled={pending}
              className={inputClass}
            />
            {fieldErrors.address_line1 ? (
              <span className="mt-2 block text-sm text-accent-deep">{fieldErrors.address_line1}</span>
            ) : null}
          </label>

          <label className="block sm:col-span-2">
            <span className="eyebrow text-ink-muted">Note (optionnel)</span>
            <input name="note" disabled={pending} className={inputClass} />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-[color:var(--line-strong)] bg-white/60 p-1">
            <button
              type="button"
              aria-label="Moins"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-full text-ink-soft hover:bg-paper-deep"
            >
              −
            </button>
            <span className="w-6 text-center text-base tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label="Plus"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              className="h-8 w-8 rounded-full text-ink-soft hover:bg-paper-deep"
            >
              +
            </button>
          </div>

          <dl className="ml-auto text-right text-sm text-ink-muted">
            <div className="flex justify-end gap-3">
              <dt>Livraison</dt>
              <dd className="tabular-nums">
                {shipping === 0 ? "Offerte" : formatMoney(shipping, product.currency)}
              </dd>
            </div>
            <div className="mt-1 flex items-baseline justify-end gap-3">
              <dt className="text-ink-soft">Total</dt>
              <dd className="font-display text-lg text-ink tabular-nums">
                {formatMoney(total, product.currency)}
              </dd>
            </div>
          </dl>
        </div>

        {result && !result.ok ? (
          <p className="mt-5 rounded-2xl bg-accent-soft px-4 py-3 text-base text-accent-deep">{result.error}</p>
        ) : null}

        {/* Buying now is the primary act — pay the courier when it arrives.
            Adding to the bag sits quietly underneath it, for a shopper who is
            still collecting pieces. */}
        <PillButton type="submit" disabled={pending} className="mt-6 w-full">
          {pending ? "Envoi…" : "Acheter"}
        </PillButton>

        <button
          type="button"
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              // The variant the shopper is looking at, so the bag shows what
              // they picked rather than the product's default photo.
              image: spotlight ?? product.images[0] ?? null,
              options,
              offerName: selectedOffer?.name ?? null,
              unitCents,
              quantity,
            })
          }
          className="mt-3 block w-full text-center text-sm text-ink-muted underline underline-offset-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink disabled:opacity-50"
        >
          Ajouter au panier
        </button>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Paiement à la livraison partout en Tunisie
        </p>
      </div>
    </form>
  );
}
