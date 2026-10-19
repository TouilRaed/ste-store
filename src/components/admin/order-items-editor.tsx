"use client";

import { useActionState, useState } from "react";
import { updateOrderItemsAction, type ActionResult } from "@/app/meddm/actions";
import { ProductImage } from "@/components/product-image";
import { PillButton } from "@/components/ui";
import { formatMoney, majorInputToMinor, minorToMajorInput, shippingFor } from "@/lib/format";
import type { AdminProduct } from "@/lib/admin/repo";
import type { Order, OrderItem, SelectedOption } from "@/lib/types";

type Line = {
  product_slug: string;
  product_name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  /** Carried through untouched so saving a quantity keeps the choice. */
  options: SelectedOption[];
  unit_cents: number;
  quantity: number;
};

const fieldClass =
  "w-full rounded-xl border border-[color:var(--line-strong)] bg-paper/60 px-3 py-2 text-[15px] outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

/**
 * Price typed in dinars while the line keeps minor units. It holds its own
 * draft string so half-typed values like "89," survive a keystroke — deriving
 * the text from the number on every render would fight the user.
 */
function PriceInput({
  valueMinor,
  currency,
  onChangeMinor,
  className,
}: {
  valueMinor: number;
  currency: string;
  onChangeMinor: (minor: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(() => minorToMajorInput(valueMinor, currency));

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const minor = majorInputToMinor(e.target.value, currency);
        if (minor !== null && !Number.isNaN(minor)) onChangeMinor(minor);
      }}
      onBlur={() => setDraft(minorToMajorInput(valueMinor, currency))}
      className={className}
    />
  );
}

function toLine(item: OrderItem): Line {
  return {
    product_slug: item.product_slug,
    product_name: item.product_name,
    image: item.image ?? null,
    size: item.size ?? null,
    color: item.color ?? null,
    options: item.options ?? [],
    unit_cents: item.unit_cents,
    quantity: item.quantity,
  };
}

/**
 * Edits what was actually ordered — quantity and unit price — and lets a piece
 * be added or dropped. Totals are recomputed on the server from whatever is
 * saved here.
 */
export function OrderItemsEditor({ order, catalogue }: { order: Order; catalogue: AdminProduct[] }) {
  const [lines, setLines] = useState<Line[]>((order.order_items ?? []).map(toLine));
  const [adding, setAdding] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateOrderItemsAction,
    null,
  );

  const patch = (index: number, changes: Partial<Line>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...changes } : line)));

  const remove = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  function addPiece(slug: string) {
    const product = catalogue.find((p) => p.slug === slug);
    if (!product) return;
    setLines((prev) => [
      ...prev,
      {
        product_slug: product.slug,
        product_name: product.name,
        image: product.images[0] ?? null,
        size: null,
        color: null,
        // A piece added by the shop has no customer choice behind it; the
        // first choice of each group is the sensible default.
        options: (product.option_groups ?? [])
          .filter((g) => g.choices.length > 0)
          .map((g) => ({ label: g.label, value: g.choices[0].name })),
        unit_cents: product.price_cents,
        quantity: 1,
      },
    ]);
    setAdding("");
  }

  const subtotal = lines.reduce((sum, line) => sum + line.unit_cents * line.quantity, 0);
  // Mirrors the server rule: only dinar orders re-derive shipping.
  const shipping = order.currency === "TND" ? shippingFor(subtotal) : order.shipping_cents;
  const dirty = JSON.stringify(lines) !== JSON.stringify((order.order_items ?? []).map(toLine));

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={order.id} />
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      <ul className="space-y-4">
        {lines.map((line, index) => (
          <li
            key={`${line.product_slug}-${index}`}
            className="flex gap-3 border-t border-[color:var(--line)] pt-4 first:border-0 first:pt-0 md:gap-4"
          >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                <ProductImage src={line.image} alt="" sizes="64px" className="object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base">{line.product_name}</p>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="shrink-0 text-sm text-accent-deep underline underline-offset-4"
                  >
                    Retirer
                  </button>
                </div>

                {/* What the customer picked, shown as it was ordered. Not
                    editable here: changing it would rewrite their choice. */}
                {line.options.length > 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    {line.options.map((o) => `${o.label} : ${o.value}`).join(" · ")}
                  </p>
                ) : null}

                {/* Only quantity and price are editable. The size and colour
                    boxes were left over from before option groups and said the
                    same thing as the recorded choice above. Whatever a line
                    already holds rides along in the hidden field untouched. */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="eyebrow text-ink-muted">Quantité</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={100}
                      value={line.quantity}
                      onChange={(e) => patch(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                      className={fieldClass}
                    />
                  </label>

                  <label className="block">
                    <span className="eyebrow text-ink-muted">Prix (DT)</span>
                    <PriceInput
                      valueMinor={line.unit_cents}
                      currency={order.currency}
                      onChangeMinor={(minor) => patch(index, { unit_cents: Math.max(0, minor) })}
                      className={fieldClass}
                    />
                  </label>
                </div>

                <p className="mt-2 text-sm text-ink-muted tabular-nums">
                  {line.quantity} × {formatMoney(line.unit_cents, order.currency)} ={" "}
                  {formatMoney(line.unit_cents * line.quantity, order.currency)}
                </p>
              </div>
          </li>
        ))}
      </ul>

      {lines.length === 0 ? (
        <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">
          Une commande doit garder au moins une pièce.
        </p>
      ) : null}

      <div className="mt-6 border-t border-[color:var(--line)] pt-5">
        <label className="block">
          <span className="eyebrow text-ink-muted">Ajouter une pièce</span>
          <select
            value={adding}
            onChange={(e) => addPiece(e.target.value)}
            className={`${fieldClass} mt-2`}
          >
            <option value="">Choisir dans le catalogue…</option>
            {catalogue.map((product) => (
              <option key={product.id} value={product.slug}>
                {product.name} — {formatMoney(product.price_cents, product.currency)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-6 space-y-2 border-t border-[color:var(--line)] pt-5 text-base">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Sous-total</dt>
          <dd className="tabular-nums">{formatMoney(subtotal, order.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Livraison</dt>
          <dd className="tabular-nums">
            {shipping === 0 ? "Offerte" : formatMoney(shipping, order.currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-[color:var(--line)] pt-4">
          <dt className="font-display text-lg">Total</dt>
          <dd className="font-display text-2xl tabular-nums">
            {formatMoney(subtotal + shipping, order.currency)}
          </dd>
        </div>
      </dl>

      {state?.error ? (
        <p className="mt-5 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="mt-5 rounded-2xl bg-[#e4f1ea] px-4 py-3 text-sm text-sage">Lignes enregistrées.</p>
      ) : null}

      <div className="mt-6">
        <PillButton type="submit" disabled={pending || lines.length === 0 || !dirty}>
          {pending ? "Enregistrement…" : dirty ? "Enregistrer les lignes" : "Aucune modification"}
        </PillButton>
      </div>
    </form>
  );
}
