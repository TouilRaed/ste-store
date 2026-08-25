"use client";

import { useActionState } from "react";
import { updateOrderAction, type ActionResult } from "@/app/admin/actions";
import { PillButton } from "@/components/ui";
import type { Order } from "@/lib/types";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-3 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

const FIELDS = [
  { name: "full_name", label: "Name", span: 2 },
  { name: "email", label: "Email", span: 2, type: "email" },
  { name: "phone", label: "Phone", span: 2 },
  { name: "address_line1", label: "Street address", span: 2 },
  { name: "address_line2", label: "Apartment, floor", span: 2 },
  { name: "city", label: "City", span: 1 },
  { name: "postal_code", label: "Postal code", span: 1 },
  { name: "country", label: "Country", span: 2 },
] as const;

/** Edits the customer, address and both notes on an existing order. */
export function OrderEditor({ order }: { order: Order }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateOrderAction,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={order.id} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.name} className={`block ${field.span === 2 ? "sm:col-span-2" : ""}`}>
            <span className="eyebrow text-ink-muted">{field.label}</span>
            <input
              name={field.name}
              type={"type" in field ? field.type : "text"}
              defaultValue={(order[field.name] as string | null) ?? ""}
              disabled={pending}
              className={inputClass}
            />
            {errors[field.name]?.length ? (
              <span className="mt-2 block text-xs text-accent-deep">{errors[field.name][0]}</span>
            ) : null}
          </label>
        ))}

        <label className="block sm:col-span-2">
          <span className="eyebrow text-ink-muted">Note du client</span>
          <textarea
            name="note"
            rows={2}
            defaultValue={order.note ?? ""}
            disabled={pending}
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="eyebrow text-accent-deep">Note interne</span>
          <textarea
            name="admin_note"
            rows={3}
            defaultValue={order.admin_note ?? ""}
            disabled={pending}
            placeholder="Only visible here — packing details, callbacks, payment arrangements…"
            className={`${inputClass} resize-none`}
          />
        </label>
      </div>

      {state?.error ? (
        <p className="mt-5 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.error}</p>
      ) : null}

      {state?.ok ? (
        <p className="mt-5 rounded-2xl bg-[#e7efe4] px-4 py-3 text-sm text-sage">Commande mise à jour.</p>
      ) : null}

      <div className="mt-6">
        <PillButton type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </PillButton>
      </div>
    </form>
  );
}
