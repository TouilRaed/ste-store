import Constants from "expo-constants";

/**
 * Where the Next.js app lives. Override per build with `apiBaseUrl` in
 * app.config.ts → expo.extra, or EXPO_PUBLIC_API_BASE_URL at runtime.
 *
 * On a physical device `localhost` is the phone itself — use your machine's
 * LAN address (e.g. http://192.168.1.12:3000) while developing.
 */
const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  fromExtra ??
  "http://localhost:3000"
).replace(/\/$/, "");
