/**
 * One place for the shapes a Tunisian phone number has to take. Mirrors the
 * site's own `lib/phone`, so the app and the web admin dial the same number.
 *
 * Orders store whatever the customer typed, usually the display form
 * "+216 53 773 703", sometimes the bare local "53773703". `tel:` and wa.me
 * both want digits with the country code and nothing else — stripping
 * punctuation alone turns a local number into `tel:+53773703`, which dials
 * nothing.
 */

const COUNTRY_CODE = "216";
const LOCAL_LENGTH = 8;

/** Digits with the country code in front. "53773703" → "21653773703". */
export function internationalPhone(input: string | null | undefined): string {
  const bare = String(input ?? "").replace(/\D/g, "");
  // "00216…" is the same number written with the international prefix spelled
  // out instead of a "+". Left in, it dials nothing.
  const digits = bare.startsWith("00") ? bare.slice(2) : bare;
  if (digits.length === 0) return "";
  return digits.length === LOCAL_LENGTH ? `${COUNTRY_CODE}${digits}` : digits;
}

/** A `tel:` url, or null when there is no number worth dialling. */
export function telUrl(input: string | null | undefined): string | null {
  const digits = internationalPhone(input);
  if (digits.length < LOCAL_LENGTH) return null;
  return `tel:+${digits}`;
}

/**
 * A wa.me url, or null when there is no number to open a chat with.
 * `text` is prefilled in the message box; WhatsApp leaves it unsent.
 */
export function whatsappUrl(input: string | null | undefined, text?: string): string | null {
  const digits = internationalPhone(input);
  if (digits.length < LOCAL_LENGTH) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
