/**
 * Money is stored as an integer number of **minor units** of the row's own
 * currency. For TND that unit is the millime (1 DT = 1000 millimes), which is
 * why the dinar formats to three decimals and the thresholds below look large.
 */

/** 8 DT delivery on every order, whatever the basket comes to. */
export const SHIPPING_FLAT_CENTS = 8_000;

/** Currencies whose minor unit is 1/1000 rather than 1/100. */
const THREE_DECIMAL = new Set(["TND", "DZD", "LYD", "IQD", "JOD", "KWD", "BHD", "OMR"]);

export function minorUnitsPer(currency: string): number {
  return THREE_DECIMAL.has(currency.toUpperCase()) ? 1000 : 100;
}

export function formatMoney(amount: number, currency = "TND"): string {
  const code = currency.toUpperCase();
  const divisor = minorUnitsPer(code);
  const value = amount / divisor;

  if (code === "TND") {
    // Tunisian shops write 220 DT, or 89,500 DT when there are millimes.
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

export function shippingFor(subtotalCents: number): number {
  return subtotalCents === 0 ? 0 : SHIPPING_FLAT_CENTS;
}

/**
 * Admin inputs are typed in DINARS (the major unit) while every column stores
 * minor units. These two convert at that boundary and nowhere else — the
 * database, the API and formatMoney all stay in minor units.
 */
export function minorToMajorInput(amount: number | null | undefined, currency = "TND"): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";
  return String(amount / minorUnitsPer(currency));
}

/** Accepts "89.5" or "89,5". Returns null for blank, NaN for unparseable. */
export function majorInputToMinor(value: unknown, currency = "TND"): number | null {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * minorUnitsPer(currency));
}
