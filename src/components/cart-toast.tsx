"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { ProductImage } from "@/components/product-image";
import { formatMoney } from "@/lib/format";

export function CartToast() {
  const { lastAdded, dismissToast } = useCart();

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 bottom-6 z-40 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        lastAdded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {lastAdded ? (
        <div className="bezel pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[1.75rem] p-1.5 ring-1 ring-[color:var(--line)] backdrop-blur-2xl">
          <div className="bezel-core flex w-full items-center gap-4 rounded-[calc(1.75rem-0.375rem)] bg-white/90 p-3">
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
              <ProductImage src={lastAdded.image} alt="" sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-ink-muted">Added to bag</p>
              <p className="truncate text-base">{lastAdded.name}</p>
              <p className="text-sm text-ink-muted tabular-nums">
                {lastAdded.options.map((o) => o.value).join(" / ") || "Modèle unique"} ·{" "}
                {formatMoney(lastAdded.unitCents)}
              </p>
            </div>
            <Link
              href="/cart"
              onClick={dismissToast}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-paper transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              View bag
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
