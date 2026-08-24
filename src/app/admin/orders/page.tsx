import Link from "next/link";
import { PageHeading, Panel, SetupNotice, StatusBadge, StatusFilter } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { isAdminDataReady, listOrders } from "@/lib/admin/repo";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/schemas";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Fulfilment" title="Orders" />
        <SetupNotice />
      </>
    );
  }

  const params = await searchParams;
  const raw = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;

  const orders = await listOrders({ status });

  return (
    <>
      <PageHeading
        eyebrow={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
        title="Orders"
        action={<StatusFilter current={status} basePath="/admin/orders" />}
      />

      <Panel>
        {orders.length === 0 ? (
          <p className="p-8 text-sm text-ink-soft">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="grid gap-3 px-6 py-5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep/60 md:grid-cols-[8rem_1fr_auto_auto_auto] md:items-center md:gap-6"
                >
                  <span className="font-mono text-[13px] tracking-wider">{order.order_number}</span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm">{order.full_name}</span>
                    <span className="block truncate text-xs text-ink-muted">{order.email}</span>
                  </span>

                  <span className="text-xs text-ink-muted">{dateLabel(order.created_at)}</span>
                  <StatusBadge status={order.status} />
                  <span className="text-sm tabular-nums md:text-right">
                    {formatMoney(order.total_cents, order.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
