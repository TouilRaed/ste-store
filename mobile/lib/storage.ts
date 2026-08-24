import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Keychain on device, localStorage in the browser — expo-secure-store has no
 * web implementation, and `expo start --web` is the quickest way to preview.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // Storage blocked — the session then lasts until reload.
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // Nothing to clean up.
      }
      return;
    }
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
