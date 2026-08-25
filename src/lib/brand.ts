/**
 * Everything client-specific lives here. Setting up the shop for a new client
 * means editing this file — nothing else hardcodes the name.
 *
 * `KEY` also namespaces the cart and admin cookies, so two shops open in the
 * same browser never share a basket or a session.
 */
export const BRAND = {
  /** Shown in the nav, footer, page titles and both admins. */
  NAME: "STE DM",
  /** Lowercase slug used for cookies, storage keys and project names. */
  KEY: "ste",
  /** One line under the logo in the footer. */
  TAGLINE: "Petites séries. Paiement à la livraison partout en Tunisie.",
  /** Leave empty to hide every Instagram link. */
  INSTAGRAM_URL: "",
  INSTAGRAM_HANDLE: "",
  /** Small print beside the logo in the footer. */
  COUNTRY_LINE: "Tunisie · paiement à la livraison",
} as const;

export const INSTAGRAM_URL = BRAND.INSTAGRAM_URL;
export const INSTAGRAM_HANDLE = BRAND.INSTAGRAM_HANDLE;

/** False hides every Instagram link rather than pointing them at nothing. */
export const hasInstagram = BRAND.INSTAGRAM_URL.length > 0;

export const CART_STORAGE_KEY = `${BRAND.KEY}.cart.v1`;
export const ADMIN_COOKIE_NAME = `${BRAND.KEY}.admin`;
export const LAST_ORDER_COOKIE_NAME = `${BRAND.KEY}.last-order`;
