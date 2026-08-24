import type { ExpoConfig } from "expo/config";

import { BRAND } from "./lib/brand";

/**
 * Was `app.json`. It is a config file now so the Expo identity — app name,
 * slug, scheme, bundle id, package — derives from BRAND instead of being
 * frozen as literals that every clone has to hand-edit.
 *
 * `apiBaseUrl` is deliberately empty: set EXPO_PUBLIC_API_BASE_URL, or fill it
 * in once the Vercel deployment exists. `lib/constants.ts` falls back to
 * http://localhost:3000 when it is blank.
 */
const config: ExpoConfig = {
  name: `${BRAND.NAME} admin`,
  slug: `${BRAND.KEY}-admin`,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: `com.${BRAND.KEY}.admin`,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FDFBF7",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // `useNextNotificationsApi` lived here in app.json. It is not in
    // @expo/config-types 57 — a legacy flag that JSON never type-checked.
    package: `com.${BRAND.KEY}.admin`,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-secure-store", "expo-notifications"],
  scheme: `${BRAND.KEY}admin`,
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  },
  // app.json also carried `notification.iosDisplayInForeground`. That key is
  // gone from @expo/config-types 57; foreground display is a runtime concern
  // now and lib/push.ts already sets it via setNotificationHandler.
};

export default config;
