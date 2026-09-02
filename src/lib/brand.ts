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
  INSTAGRAM_URL: "https://www.instagram.com/ste.dm.ste.dm/",
  INSTAGRAM_HANDLE: "@ste.dm.ste.dm",
  /** Leave empty to hide every Facebook link. */
  FACEBOOK_URL: "https://www.facebook.com/stedmtunisie",
  /** Small print beside the logo in the footer. */
  COUNTRY_LINE: "Tunisie · paiement à la livraison",
} as const;

export const INSTAGRAM_URL = BRAND.INSTAGRAM_URL;
export const INSTAGRAM_HANDLE = BRAND.INSTAGRAM_HANDLE;
export const FACEBOOK_URL = BRAND.FACEBOOK_URL;

/** False hides every Instagram link rather than pointing them at nothing. */
export const hasInstagram = BRAND.INSTAGRAM_URL.length > 0;
/** False hides every Facebook link rather than pointing them at nothing. */
export const hasFacebook = BRAND.FACEBOOK_URL.length > 0;

export const CART_STORAGE_KEY = `${BRAND.KEY}.cart.v1`;
export const ADMIN_COOKIE_NAME = `${BRAND.KEY}.admin`;
export const LAST_ORDER_COOKIE_NAME = `${BRAND.KEY}.last-order`;
