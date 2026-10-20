"use client";

import { useEffect, useState } from "react";
import { GOVERNORATES } from "@/lib/tunisia";

type Region = { id: number; name: string };

/**
 * Gouvernorat then délégation, both from Intigo's own lists.
 *
 * Taking the names from Intigo rather than typing our own is what makes the
 * parcel bookable later: `/parcels/by-name` rejects an unknown city or
 * délégation with a 400, and their spellings are unaccented ("Beja", not
 * "Béja").
 *
 * If their API is unreachable we fall back to the bundled gouvernorat list so
 * a shopper can still order — the délégation is then collected by phone, as
 * it was before.
 */
export function RegionSelect({
  className,
  disabled,
  governorateError,
  districtError,
}: {
  className: string;
  disabled?: boolean;
  governorateError?: string;
  districtError?: string;
}) {
  const [cities, setCities] = useState<Region[] | null>(null);
  const [districts, setDistricts] = useState<Region[] | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [cityName, setCityName] = useState("");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/regions");
        const body = await res.json();
        if (!active) return;
        if (!res.ok || !Array.isArray(body.cities) || body.cities.length === 0) {
          setOffline(true);
          return;
        }
        setCities(body.cities);
      } catch {
        if (active) setOffline(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cityId === null) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/regions?city_id=${cityId}`);
        const body = await res.json();
        if (!active) return;
        setDistricts(res.ok && Array.isArray(body.districts) ? body.districts : []);
      } catch {
        if (active) setDistricts([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [cityId]);

  // Fallback: bundled gouvernorats, no délégation.
  if (offline) {
    return (
      <label className="block">
        <span className="label-ar text-ink-muted">الولاية</span>
        <select name="governorate" defaultValue="" disabled={disabled} className={className}>
          <option value="" disabled>
            اختر…
          </option>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {governorateError ? (
          <span className="mt-2 block text-sm text-accent-deep">{governorateError}</span>
        ) : null}
      </label>
    );
  }

  return (
    <>
      <label className="block">
        <span className="label-ar text-ink-muted">الولاية</span>
        {/* The server stores the name, so post that rather than the id. */}
        <input type="hidden" name="governorate" value={cityName} />
        <select
          value={cityId ?? ""}
          disabled={disabled || !cities}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            setDistricts(null);
            setCityId(id);
            setCityName(cities?.find((c) => c.id === id)?.name ?? "");
          }}
          className={className}
        >
          <option value="" disabled>
            {cities ? "اختر…" : "جاري التحميل…"}
          </option>
          {(cities ?? []).map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {governorateError ? (
          <span className="mt-2 block text-sm text-accent-deep">{governorateError}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="label-ar text-ink-muted">المعتمدية</span>
        <select
          name="district"
          defaultValue=""
          disabled={disabled || !districts || districts.length === 0}
          className={className}
        >
          <option value="" disabled>
            {cityId === null
              ? "اختر الولاية أولا"
              : districts
                ? "اختر…"
                : "جاري التحميل…"}
          </option>
          {(districts ?? []).map((district) => (
            <option key={district.id} value={district.name}>
              {district.name}
            </option>
          ))}
        </select>
        {districtError ? (
          <span className="mt-2 block text-sm text-accent-deep">{districtError}</span>
        ) : null}
      </label>
    </>
  );
}
