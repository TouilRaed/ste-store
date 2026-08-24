import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK = 100;

export type OrderPush = {
  orderNumber: string;
  customer: string;
  totalCents: number;
  currency: string;
  itemCount: number;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

async function listTokens(): Promise<string[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.from("admin_devices").select("token");
  if (error) {
    console.error("[push] could not read devices:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.token as string);
}

async function forgetTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  await admin.from("admin_devices").delete().in("token", tokens);
}

/**
 * Fires the "new order" push to every registered admin device.
 *
 * Never throws: a notification failure must not take an order down with it —
 * the order is already committed by the time this runs.
 */
export async function notifyNewOrder(order: OrderPush): Promise<void> {
  try {
    const tokens = await listTokens();
    if (tokens.length === 0) return;

    const body =
      `${order.customer} · ${order.itemCount} ${order.itemCount === 1 ? "piece" : "pieces"} · ` +
      `${money(order.totalCents, order.currency)}`;

    const dead: string[] = [];

    for (let i = 0; i < tokens.length; i += CHUNK) {
      const batch = tokens.slice(i, i + CHUNK).map((to) => ({
        to,
        title: "New order",
        body,
        sound: "default" as const,
        priority: "high" as const,
        channelId: "orders",
        badge: 1,
        data: { type: "order", orderNumber: order.orderNumber },
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error("[push] Expo rejected the batch:", response.status);
        continue;
      }

      const payload = (await response.json()) as { data?: ExpoTicket[] };

      payload.data?.forEach((ticket, index) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          dead.push(batch[index].to);
        } else if (ticket.status === "error") {
          console.error("[push] ticket error:", ticket.message);
        }
      });
    }

    // Uninstalled apps keep their row forever otherwise.
    await forgetTokens(dead);
  } catch (error) {
    console.error("[push] notify failed:", error);
  }
}
