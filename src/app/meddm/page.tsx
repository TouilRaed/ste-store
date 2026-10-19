import Link from "next/link";
import { PageHeading, Panel, SetupNotice, StatusBadge } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { getStats, isAdminDataReady } from "@/lib/admin/repo";
import { formatDate, formatMoney } from "@/lib/format";

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
    {
      label: "Chiffre d'affaires",
      value: formatMoney(stats.revenueCents, stats.currency),
      hint: "Annulées non comptées",
    },
    {
      label: "Commandes",
      value: String(stats.orders.total),
      hint: `${stats.orders.pending} en attente`,
    },
    {
      label: "Produits",
      value: String(stats.products.total),
      hint: `${stats.products.active} en vente`,
    },
    {
      label: "Expédiées",
      value: String(stats.orders.shipped),
      hint: `${stats.orders.ready} prêtes à partir`,
    },
  ];

  return (
    <>
      <PageHeading eyebrow="Aperçu" title="Tableau de bord" />

      {/* Two across on a phone: one tile per row turned four numbers into most
          of a screen's worth of scrolling. */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Panel key={tile.label} className="h-full">
            <div className="flex h-full flex-col p-4 md:p-6">
              <p className="eyebrow text-ink-muted">{tile.label}</p>
              <p className="font-display mt-3 text-2xl tabular-nums md:mt-4 md:text-3xl">{tile.value}</p>
              <p className="mt-auto pt-1.5 text-xs text-ink-muted">{tile.hint}</p>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-8 md:mt-10">
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <p className="eyebrow text-ink-muted">Dernières commandes</p>
          <Link
            href="/meddm/orders"
            className="text-[13px] text-ink-soft underline underline-offset-4"
          >
            Toutes
          </Link>
        </div>

        <Panel>
          {stats.recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-ink-soft md:p-8">Aucune commande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line)]">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  {/* Name and number down the left, money and status down the
                      right. Wrapping these five things in a row put the total
                      on its own line and read as a broken layout. */}
                  <Link
                    href={`/meddm/orders/${order.id}`}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep/60 md:px-6 md:py-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[13px] tracking-wider">
                        {order.order_number}
                      </span>
                      <span className="mt-1 block truncate text-sm text-ink-soft">
                        {order.full_name} · {formatDate(order.created_at)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-sm tabular-nums">
                        {formatMoney(order.total_cents, order.currency)}
                      </span>
                      <StatusBadge status={order.status} />
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
