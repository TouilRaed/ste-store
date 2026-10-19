import Link from "next/link";
import { PageHeading, Panel, SetupNotice, StatusBadge, StatusFilter } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { isAdminDataReady, listOrders } from "@/lib/admin/repo";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/schemas";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: PageProps<"/meddm/orders">) {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Traitement" title="Commandes" />
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
        eyebrow={`${orders.length} commande${orders.length === 1 ? "" : "s"}`}
        title="Commandes"
        action={<StatusFilter current={status} basePath="/meddm/orders" />}
      />

      <Panel>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-ink-soft md:p-8">Rien pour le moment.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]">
            {orders.map((order) => (
              <li key={order.id}>
                {/* Two columns at every width: who and when on the left, how
                    much and where it stands on the right. The old grid gave
                    each of five fields a full-width row on a phone. */}
                <Link
                  href={`/meddm/orders/${order.id}`}
                  className="flex items-start gap-3 px-4 py-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep/60 md:grid md:grid-cols-[8rem_1fr_auto_auto_auto] md:items-center md:gap-6 md:px-6 md:py-5"
                >
                  <span className="min-w-0 flex-1 md:contents">
                    <span className="block font-mono text-[13px] tracking-wider">
                      {order.order_number}
                    </span>

                    <span className="mt-1 block min-w-0 md:mt-0">
                      <span className="block truncate text-sm">{order.full_name}</span>
                      <span className="block truncate text-xs text-ink-muted">
                        {order.email || order.phone}
                      </span>
                    </span>

                    <span className="mt-1 block text-xs text-ink-muted md:mt-0">
                      {formatDate(order.created_at)}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col-reverse items-end gap-1.5 md:contents">
                    <StatusBadge status={order.status} />
                    <span className="text-sm tabular-nums md:text-right">
                      {formatMoney(order.total_cents, order.currency)}
                    </span>
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
