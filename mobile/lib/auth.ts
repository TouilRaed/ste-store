import { storage } from "./storage";
import { ADMIN_TOKEN_KEY } from "./brand";
import { useSyncExternalStore } from "react";

const TOKEN_KEY = ADMIN_TOKEN_KEY;

let cached: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export async function loadToken(): Promise<string | null> {
  try {
    cached = await storage.get(TOKEN_KEY);
  } catch {
    cached = null;
  }
  loaded = true;
  emit();
  return cached;
}

export async function setToken(token: string): Promise<void> {
  cached = token;
  loaded = true;
  await storage.set(TOKEN_KEY, token);
  emit();
}

export async function clearToken(): Promise<void> {
  cached = null;
  loaded = true;
  await storage.remove(TOKEN_KEY);
  emit();
}

export function getToken(): string | null {
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `null` while the keychain is still being read, then the token or "". */
export function useAuthToken(): { token: string | null; ready: boolean } {
  const token = useSyncExternalStore(
    subscribe,
    () => cached,
    () => null,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => loaded,
    () => false,
  );
  return { token, ready };
}
