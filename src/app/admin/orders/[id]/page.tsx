import Link from "next/link";
import { notFound } from "next/navigation";
import { setOrderStatusAction } from "@/app/admin/actions";
import { OrderEditor } from "@/components/admin/order-editor";
import { ShipButton } from "@/components/admin/ship-button";
import { OrderItemsEditor } from "@/components/admin/order-items-editor";
import { PageHeading, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { AdminError, getOrder, listProducts } from "@/lib/admin/repo";
import { ORDER_STATUSES } from "@/lib/admin/schemas";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdminPage();
  const { id } = await params;

  const order = await getOrder(id).catch((error) => {
    if (error instanceof AdminError && error.status === 404) notFound();
    throw error;
  });

  const catalogue = await listProducts();

  return (
    <>
      <Link href="/admin/orders" className="text-[13px] text-ink-soft underline underline-offset-4">
        ← All orders
      </Link>

      <div className="mt-6">
        <PageHeading
          eyebrow={new Date(order.created_at).toLocaleString("en-GB")}
          title={order.order_number}
          action={<StatusBadge status={order.status} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Panel>
          <div className="p-6 md:p-8">
            <p className="eyebrow text-ink-muted">Pièces commandées</p>
            <p className="mt-2 text-sm text-ink-muted">
              Taille, couleur, quantité et prix — le total se recalcule à l&apos;enregistrement.
            </p>
            <div className="mt-6">
              <OrderItemsEditor order={order} catalogue={catalogue} />
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel>
            <div className="p-6">
              <p className="eyebrow text-ink-muted">Statut</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <form key={status} action={setOrderStatusAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={status === order.status}
                      className={`rounded-full border px-4 py-1.5 text-[13px] capitalize transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-default ${
                        status === order.status
                          ? "border-transparent bg-ink text-paper"
                          : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
                      }`}
                    >
                      {status}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="p-6">
              <p className="eyebrow text-ink-muted">Livraison</p>
              <div className="mt-5">
                <ShipButton
                  orderId={order.id}
                  orderCity={order.city}
                  orderDistrict={order.district ?? null}
                  trackingCode={order.tracking_code ?? null}
                  cancelled={order.status === "cancelled"}
                />
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="p-6">
              <p className="eyebrow text-ink-muted">Client et livraison</p>
              <p className="mt-2 text-xs text-ink-muted">
                Edit anything the customer got wrong, and keep staff notes here.
              </p>
              <div className="mt-6">
                <OrderEditor order={order} />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
