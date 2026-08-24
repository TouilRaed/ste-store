import type { CartLine } from "@/lib/types";
import { CART_STORAGE_KEY } from "@/lib/brand";

/**
 * The cart lives in a module-level store rather than component state so it can
 * be read through `useSyncExternalStore` — that keeps the server snapshot empty
 * (no hydration mismatch) without a setState-in-effect on mount.
 */

const STORAGE_KEY = CART_STORAGE_KEY;
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(
      (l): l is CartLine => typeof l === "object" && l !== null && "key" in l && "quantity" in l,
    );
    return valid.length > 0 ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — the cart
    // then simply lives for the session.
  }
}

function commit(next: CartLine[]) {
  lines = next;
  write();
  emit();
}

export function subscribe(listener: () => void): () => void {
  if (!loaded) {
    loaded = true;
    lines = read();
  }
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    lines = read();
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): CartLine[] {
  return lines;
}

export function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

export function getLoaded(): boolean {
  return loaded;
}

export function getLoadedServer(): boolean {
  return false;
}

export function lineKey(productId: string, size: string | null, color: string | null): string {
  return `${productId}:${size ?? "-"}:${color ?? "-"}`;
}

export function addLine(incoming: Omit<CartLine, "key">): CartLine {
  const key = lineKey(incoming.productId, incoming.size, incoming.color);
  const line: CartLine = { ...incoming, key };
  const existing = lines.find((l) => l.key === key);

  commit(
    existing
      ? lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + incoming.quantity } : l))
      : [...lines, line],
  );

  return line;
}

export function setLineQuantity(key: string, quantity: number) {
  commit(
    quantity <= 0
      ? lines.filter((l) => l.key !== key)
      : lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
  );
}

export function removeLine(key: string) {
  commit(lines.filter((l) => l.key !== key));
}

export function clearLines() {
  commit(EMPTY);
}
