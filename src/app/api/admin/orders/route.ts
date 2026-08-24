import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin/api";
import { listOrders } from "@/lib/admin/repo";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/schemas";

export const GET = withAdmin(async (request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const orders = await listOrders({
    status: ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
    search: url.searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({ orders });
});
