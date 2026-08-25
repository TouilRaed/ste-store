/**
 * Mirrors src/lib/format.ts on the web. Amounts are integer minor units of
 * their own currency — millimes for TND (1 DT = 1000), cents elsewhere.
 */

const THREE_DECIMAL = new Set(["TND", "DZD", "LYD", "IQD", "JOD", "KWD", "BHD", "OMR"]);

export function minorUnitsPer(currency: string): number {
  return THREE_DECIMAL.has(currency.toUpperCase()) ? 1000 : 100;
}

export function formatMoney(amount: number, currency = "TND"): string {
  const code = currency.toUpperCase();
  const divisor = minorUnitsPer(code);
  const value = amount / divisor;

  if (code === "TND") {
    const hasFraction = amount % divisor !== 0;
    const text = new Intl.NumberFormat("fr-TN", {
      minimumFractionDigits: hasFraction ? 3 : 0,
      maximumFractionDigits: 3,
    }).format(value);
    return `${text} DT`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: amount % divisor === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 8 DT delivery on every order — mirrors SHIPPING_FLAT_CENTS on the web. */
export const SHIPPING_FLAT_CENTS = 8_000;

export function shippingFor(subtotalCents: number): number {
  return subtotalCents === 0 ? 0 : SHIPPING_FLAT_CENTS;
}

/**
 * Admin inputs are typed in DINARS while every column stores minor units.
 * Mirrors minorToMajorInput / majorInputToMinor in src/lib/format.ts.
 */
export function minorToMajorInput(amount: number | null | undefined, currency = "TND"): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";
  return String(amount / minorUnitsPer(currency));
}

/** Accepts "89.5" or "89,5". null for blank, NaN when unparseable. */
export function majorInputToMinor(value: unknown, currency = "TND"): number | null {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * minorUnitsPer(currency));
}
