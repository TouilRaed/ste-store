"use client";

import { useState } from "react";
import { majorInputToMinor, minorToMajorInput } from "@/lib/format";
import type { ProductOffer } from "@/lib/types";

type Row = { name: string; price: string };

const rowInputClass =
  "w-full rounded-xl border border-[color:var(--line-strong)] bg-paper/60 px-3 py-2 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

/**
 * Repeatable "offer name + price" rows, e.g. « 3 pièces » at 120 DT.
 *
 * Prices are typed in dinars and serialised to minor units in a hidden field,
 * so the surrounding uncontrolled form posts one `offers` JSON string and the
 * server keeps its single conversion boundary.
 */
export function OffersEditor({
  defaultOffers = [],
  currency = "TND",
}: {
  defaultOffers?: ProductOffer[];
  currency?: string;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    defaultOffers.map((offer) => ({
      name: offer.name,
      price: minorToMajorInput(offer.price_cents, currency),
    })),
  );

  // Rows without a name are drafts, not offers — they never reach the server.
  const payload = rows
    .map((row) => ({
      name: row.name.trim(),
      price_cents: majorInputToMinor(row.price, currency) ?? 0,
    }))
    .filter((row) => row.name.length > 0 && !Number.isNaN(row.price_cents));

  function update(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div>
      <input type="hidden" name="offers" value={JSON.stringify(payload)} />

      {rows.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-muted">
          Aucune offre. Le produit se vend au prix de base.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <li key={index} className="flex items-end gap-3">
              <label className="block flex-1">
                <span className="eyebrow text-ink-muted">Nom de l&apos;offre</span>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder="3 pièces"
                  className={`mt-2 ${rowInputClass}`}
                />
              </label>

              <label className="block w-32">
                <span className="eyebrow text-ink-muted">Prix (DT)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.price}
                  onChange={(e) => update(index, { price: e.target.value })}
                  placeholder="120"
                  className={`mt-2 ${rowInputClass}`}
                />
              </label>

              <button
                type="button"
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                className="rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft hover:text-accent-deep"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setRows((current) => [...current, { name: "", price: "" }])}
        className="mt-4 rounded-xl border border-[color:var(--line-strong)] px-4 py-2 text-sm transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft hover:text-accent-deep"
      >
        Ajouter une offre
      </button>
    </div>
  );
}
