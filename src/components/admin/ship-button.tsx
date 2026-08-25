"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PillButton } from "@/components/ui";

/**
 * Hands the order to Intigo. Disabled once a tracking code exists so a second
 * click cannot book a second driver for the same parcel.
 */
export function ShipButton({
  orderId,
  trackingCode,
  cancelled,
}: {
  orderId: string;
  trackingCode: string | null;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(trackingCode);

  if (code) {
    return (
      <div>
        <p className="eyebrow text-ink-muted">Expédiée</p>
        <p className="mt-2 font-mono text-sm break-all text-ink">{code}</p>
      </div>
    );
  }

  async function ship() {
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/ship`, { method: "POST" });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? `Échec (HTTP ${res.status}).`);
      return;
    }

    setCode(body.trackingCode ?? null);
    router.refresh();
  }

  return (
    <div>
      <PillButton
        disabled={pending || cancelled}
        onClick={() => startTransition(ship)}
        className="w-full"
      >
        {pending ? "Envoi à Intigo…" : "Prêt à expédier"}
      </PillButton>

      {cancelled ? (
        <p className="mt-3 text-sm text-ink-muted">Commande annulée.</p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-accent-deep">{error}</p> : null}
    </div>
  );
}
