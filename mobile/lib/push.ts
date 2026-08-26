import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiFetch } from "./api";
import { theme } from "./theme";

const CHANNEL = "orders";

let registered: string | null = null;

/** Foreground behaviour: an order should interrupt, not sit silently in a tray. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "New orders",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 200, 250],
    lightColor: theme.accent,
    sound: "default",
  });
}

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId
  );
}

/**
 * Asks for permission, gets the Expo push token and registers it with the
 * server. Safe to call on every sign-in — the server upserts by token.
 *
 * Returns the token, or null with the reason logged (simulators have no push
 * hardware, and a token needs an EAS project id).
 */
/** Last failure reason, surfaced in Réglages so a silent failure is visible. */
export let lastPushError: string | null = null;

export async function registerForOrderPushes(): Promise<string | null> {
  lastPushError = null;
  if (!Device.isDevice) {
    lastPushError = "Un émulateur ne reçoit pas de notifications — testez sur un vrai téléphone.";
    console.warn("[push]", lastPushError);
    return null;
  }

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    lastPushError = "Permission refusée. Autorisez les notifications dans les réglages Android.";
    console.warn("[push]", lastPushError);
    return null;
  }

  const id = projectId();
  if (!id) {
    lastPushError = "APK trop ancienne (aucun projet EAS). Installez la dernière version.";
    console.warn("[push]", lastPushError);
    return null;
  }

  let token: string;
  try {
    ({ data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id }));
  } catch (error) {
    // Usually a missing FCM key on the Expo project, or a package-name mismatch.
    lastPushError = `Expo n'a pas pu créer le jeton : ${
      error instanceof Error ? error.message : "erreur inconnue"
    }`;
    console.warn("[push]", lastPushError);
    return null;
  }

  try {
    await apiFetch("/api/admin/devices", {
      method: "POST",
      body: { token, platform: Platform.OS },
    });
  } catch (error) {
    lastPushError = `Enregistrement refusé par le serveur : ${
      error instanceof Error ? error.message : "erreur inconnue"
    }`;
    console.warn("[push]", lastPushError);
    return null;
  }

  registered = token;
  return token;
}

/** Stops this device receiving orders — called on sign-out. */
export async function unregisterOrderPushes(): Promise<void> {
  if (!registered) return;
  try {
    await apiFetch("/api/admin/devices", { method: "DELETE", body: { token: registered } });
  } catch {
    // Signing out locally matters more than tidying the server row.
  }
  registered = null;
}
