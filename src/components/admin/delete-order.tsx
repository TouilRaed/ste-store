"use client";

import { useState } from "react";
import { deleteOrderAction } from "@/app/meddm/actions";

/**
 * Deletes an order, in two taps.
 *
 * A piece can be put back in the catalogue; an order cannot be put back at
 * all, and this button sits on a page full of ordinary save buttons. The
 * second tap is the whole safeguard — it asks in place rather than through a
 * browser dialog, which on a phone is a grey box with no context in it.
 */
export function DeleteOrder({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="min-h-11 rounded-full border border-[color:var(--line-strong)] px-5 py-2.5 text-[13px] text-accent-deep transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft active:scale-[0.98]"
      >
        Supprimer la commande
      </button>
    );
  }

  return (
    <form action={deleteOrderAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={orderId} />
      <p className="w-full text-sm text-ink-soft">
        Supprimer {orderNumber} définitivement, avec ses lignes ? Cela ne peut pas être annulé.
      </p>
      <button
        type="submit"
        className="min-h-11 rounded-full bg-accent-deep px-5 py-2.5 text-[13px] text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      >
        Oui, supprimer
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="min-h-11 px-2 text-[13px] text-ink-soft underline underline-offset-4"
      >
        Annuler
      </button>
    </form>
  );
}
