/**
 * Mirror of `src/lib/brand.ts` in the web app.
 *
 * The Expo app is a separate npm project with its own node_modules and Metro
 * root, so it cannot import across into the Next.js `src/` tree without
 * `watchFolders` config that tends to break EAS builds. Keeping a small mirror
 * here is the cheaper trade — but it means a new client is a TWO-file edit:
 * this file and `src/lib/brand.ts`. Keep the two in sync.
 */
import brand from "../brand.json";

/**
 * Read from brand.json rather than declared here: `app.config.ts` is loaded by
 * Expo through a CommonJS shim that cannot resolve a .ts import, so the config
 * and the app have to share a format both can read.
 */
export const BRAND = brand;

/** Namespaces the stored admin JWT so two shops never share a session. */
export const ADMIN_TOKEN_KEY = `${BRAND.KEY}_admin_jwt`;
