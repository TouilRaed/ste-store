/**
 * One place for the shapes a Tunisian phone number has to take.
 *
 * Orders store whatever the customer typed, usually the display form
 * "+216 53 773 703", sometimes the bare local "53773703". Everything that does
 * something with it wants a different cut: the courier wants the eight local
 * digits, Meta wants digits with the country code, `tel:` wants the dialable
 * form, and wa.me wants digits with the country code and nothing else.
 */

/** Tunisia. Every number the shop handles is local unless it says otherwise. */
const COUNTRY_CODE = "216";

const LOCAL_LENGTH = 8;

function digitsOf(input: string | null | undefined): string {
  return String(input ?? "").replace(/\D/g, "");
}

/** Digits with the country code in front. "53773703" → "21653773703". */
export function internationalPhone(input: string | null | undefined): string {
  const digits = digitsOf(input);
  if (digits.length === 0) return "";
  return digits.length === LOCAL_LENGTH ? `${COUNTRY_CODE}${digits}` : digits;
}

/** Just the local digits, the way the courier's API wants them. */
export function localPhone(input: string | null | undefined): string {
  const digits = digitsOf(input);
  return digits.startsWith(COUNTRY_CODE) ? digits.slice(COUNTRY_CODE.length) : digits;
}

/** A `tel:` href, or null when there is no number worth dialling. */
export function telHref(input: string | null | undefined): string | null {
  const digits = internationalPhone(input);
  if (digits.length < LOCAL_LENGTH) return null;
  return `tel:+${digits}`;
}

/**
 * A wa.me link, or null when there is no number to open a chat with.
 * `text` is prefilled in the message box; WhatsApp leaves it unsent.
 */
export function whatsappHref(input: string | null | undefined, text?: string): string | null {
  const digits = internationalPhone(input);
  if (digits.length < LOCAL_LENGTH) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
