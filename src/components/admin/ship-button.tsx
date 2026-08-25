"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PillButton } from "@/components/ui";

type Region = { id: number; name: string };

const selectClass =
  "mt-2 w-full rounded-2xl border border-[color:var(--line-strong)] bg-paper/60 px-4 py-3 text-sm outline-none transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-accent focus:bg-white";

/** Loose match so "Ben Arous" finds Intigo's spelling of the same gouvernorat. */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/**
 * Books the parcel with Intigo.
 *
 * City and district are chosen from Intigo's own lists rather than typed:
 * `/parcels/by-name` rejects an unknown name with a 400, and our orders only
 * carry a gouvernorat — never a délégation.
 */
export function ShipButton({
  orderId,
  orderCity,
  trackingCode,
  cancelled,
}: {
  orderId: string;
  orderCity: string;
  trackingCode: string | null;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(trackingCode);

  const [cities, setCities] = useState<Region[] | null>(null);
  const [districts, setDistricts] = useState<Region[] | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [districtName, setDistrictName] = useState("");

  const shipped = Boolean(code);

  useEffect(() => {
    if (shipped || cancelled) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/admin/intigo/regions");
        const body = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(body.error ?? "Impossible de charger les villes Intigo.");
          return;
        }
        const list: Region[] = body.cities ?? [];
        setCities(list);
        // Prefill from the order's gouvernorat when Intigo spells it the same.
        const match = list.find((c) => fold(c.name) === fold(orderCity));
        if (match) setCityId(match.id);
      } catch {
        if (active) setError("Impossible de charger les villes Intigo.");
      }
    })();

    return () => {
      active = false;
    };
  }, [shipped, cancelled, orderCity]);

  useEffect(() => {
    if (cityId === null) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/admin/intigo/regions?city_id=${cityId}`);
        const body = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(body.error ?? "Impossible de charger les délégations.");
          return;
        }
        setDistricts(body.districts ?? []);
      } catch {
        if (active) setError("Impossible de charger les délégations.");
      }
    })();

    return () => {
      active = false;
    };
  }, [cityId]);

  if (shipped) {
    return (
      <div>
        <p className="eyebrow text-ink-muted">Expédiée · Intigo</p>
        <p className="mt-2 font-mono text-sm break-all text-ink">{code}</p>
      </div>
    );
  }

  if (cancelled) {
    return <p className="text-sm text-ink-muted">Commande annulée.</p>;
  }

  const cityName = cities?.find((c) => c.id === cityId)?.name ?? "";
  const ready = Boolean(cityName && districtName);

  async function ship() {
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city_name: cityName, district_name: districtName }),
    });
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
      <label className="block">
        <span className="eyebrow text-ink-muted">Ville</span>
        <select
          value={cityId ?? ""}
          onChange={(e) => {
            // Reset here rather than in an effect: eslint bans a synchronous
            // setState inside one, and this is where the change actually is.
            setDistricts(null);
            setDistrictName("");
            setCityId(e.target.value ? Number(e.target.value) : null);
          }}
          className={selectClass}
        >
          <option value="">{cities ? "Choisir une ville" : "Chargement…"}</option>
          {(cities ?? []).map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="eyebrow text-ink-muted">Délégation</span>
        <select
          value={districtName}
          onChange={(e) => setDistrictName(e.target.value)}
          disabled={!districts}
          className={selectClass}
        >
          <option value="">
            {cityId === null ? "Choisir d'abord une ville" : districts ? "Choisir une délégation" : "Chargement…"}
          </option>
          {(districts ?? []).map((district) => (
            <option key={district.id} value={district.name}>
              {district.name}
            </option>
          ))}
        </select>
      </label>

      <PillButton
        disabled={pending || !ready}
        onClick={() => startTransition(ship)}
        className="mt-5 w-full"
      >
        {pending ? "Envoi à Intigo…" : "Prêt à expédier"}
      </PillButton>

      {error ? <p className="mt-3 text-sm text-accent-deep">{error}</p> : null}
    </div>
  );
}
