/** The 24 gouvernorats, used by the cash-on-delivery form. */
export const GOVERNORATES = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "La Manouba",
  "Le Kef",
  "Mahdia",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

/**
 * Accepts the shapes people actually type: 8 local digits, with or without
 * spaces, and with or without the +216 country code.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const local = digits.startsWith("216") ? digits.slice(3) : digits;
  if (local.length !== 8) return null;
  if (!/^[2459]/.test(local)) return null; // mobile and landline prefixes in use
  return `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}
