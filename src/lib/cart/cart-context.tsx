"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as store from "@/lib/cart/store";
import { shippingFor } from "@/lib/format";
import type { CartLine } from "@/lib/types";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  /** False until localStorage has been read on the client. */
  hydrated: boolean;
  lastAdded: CartLine | null;
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  dismissToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useSyncExternalStore(store.subscribe, store.getLoaded, store.getLoadedServer);

  const [lastAdded, setLastAdded] = useState<CartLine | null>(null);

  const add = useCallback((incoming: Omit<CartLine, "key">) => {
    setLastAdded(store.addLine(incoming));
  }, []);

  const dismissToast = useCallback(() => setLastAdded(null), []);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(() => setLastAdded(null), 4000);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
    const shippingCents = shippingFor(subtotalCents);
    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      hydrated,
      lastAdded,
      add,
      setQuantity: store.setLineQuantity,
      remove: store.removeLine,
      clear: store.clearLines,
      dismissToast,
    };
  }, [lines, hydrated, lastAdded, add, dismissToast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
