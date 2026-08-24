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
export async function registerForOrderPushes(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[push] simulators cannot receive push notifications");
    return null;
  }

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    console.warn("[push] notification permission denied");
    return null;
  }

  const id = projectId();
  if (!id) {
    console.warn("[push] no EAS project id — run `npx eas init` in mobile/");
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });

  await apiFetch("/api/admin/devices", {
    method: "POST",
    body: { token, platform: Platform.OS },
  });

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
