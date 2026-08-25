/**
 * Mirror of `src/lib/brand.ts` in the web app.
 *
 * The Expo app is a separate npm project with its own node_modules and Metro
 * root, so it cannot import across into the Next.js `src/` tree without
 * `watchFolders` config that tends to break EAS builds. Keeping a small mirror
 * here is the cheaper trade — but it means a new client is a TWO-file edit:
 * this file and `src/lib/brand.ts`. Keep the two in sync.
 */
export const BRAND = {
  /** Shown on the login screen and in the app name. */
  NAME: "STE DM",
  /** Lowercase slug used for the Expo slug, scheme, bundle id and token key. */
  KEY: "ste",
} as const;

/** Namespaces the stored admin JWT so two shops never share a session. */
export const ADMIN_TOKEN_KEY = `${BRAND.KEY}_admin_jwt`;
