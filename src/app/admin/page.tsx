import Link from "next/link";
import { PageHeading, Panel, SetupNotice, StatusBadge } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { getStats, isAdminDataReady } from "@/lib/admin/repo";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Aperçu" title="Tableau de bord" />
        <SetupNotice />
      </>
    );
  }

  const stats = await getStats();

  const tiles = [
    { label: "Chiffre d'affaires", value: formatMoney(stats.revenueCents, stats.currency), hint: "excl. cancelled" },
    { label: "Commandes", value: String(stats.orders.total), hint: `${stats.orders.pending} en attente` },
    { label: "Produits", value: String(stats.products.total), hint: `${stats.products.active} active` },
    { label: "Stock faible", value: String(stats.products.lowStock), hint: "8 or fewer left" },
  ];

  return (
    <>
      <PageHeading eyebrow="Aperçu" title="Tableau de bord" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Panel key={tile.label}>
            <div className="p-6">
              <p className="eyebrow text-ink-muted">{tile.label}</p>
              <p className="font-display mt-4 text-3xl tabular-nums">{tile.value}</p>
              <p className="mt-2 text-xs text-ink-muted">{tile.hint}</p>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <p className="eyebrow text-ink-muted">Dernières commandes</p>
          <Link href="/admin/orders" className="text-[13px] text-ink-soft underline underline-offset-4">
            All orders
          </Link>
        </div>

        <Panel>
          {stats.recentOrders.length === 0 ? (
            <p className="p-8 text-sm text-ink-soft">Aucune commande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line)]">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep/60"
                  >
                    <span className="font-mono text-[13px] tracking-wider">{order.order_number}</span>
                    <span className="text-sm text-ink-soft">{order.full_name}</span>
                    <StatusBadge status={order.status} />
                    <span className="ml-auto text-sm tabular-nums">
                      {formatMoney(order.total_cents, order.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
