import type { ExpoConfig } from "expo/config";

import BRAND from "./brand.json";

/**
 * Was `app.json`. It is a config file now so the Expo identity — app name,
 * slug, scheme, bundle id, package — derives from BRAND instead of being
 * frozen as literals that every clone has to hand-edit.
 *
 * `apiBaseUrl` must point at the deployed storefront: on a phone "localhost"
 * is the phone itself, so a build that falls back to it cannot reach anything.
 * EXPO_PUBLIC_API_BASE_URL overrides it for local development.
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://stedm.net";
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
    // Lets the native Firebase SDK register with FCM on the device — the
    // service account key uploaded to EAS only lets Expo's backend *send*
    // through FCM; without this file the app has no Firebase project to
    // register against, so getExpoPushTokenAsync() fails on-device.
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
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
  // EAS could not write this itself — a dynamic config is not machine-editable.
  // lib/push.ts reads extra.eas.projectId to mint an Expo push token; without
  // it registration silently does nothing and no notification ever arrives.
  owner: "touilraed",
  extra: {
    apiBaseUrl: API_BASE_URL,
    eas: {
      projectId: "5d2e93d1-9208-45eb-a24b-683a316aa0bc",
    },
  },
  // app.json also carried `notification.iosDisplayInForeground`. That key is
  // gone from @expo/config-types 57; foreground display is a runtime concern
  // now and lib/push.ts already sets it via setNotificationHandler.
};

export default config;
