import type { Metadata } from "next";
import { cookies } from "next/headers";
import { MetaPurchase } from "@/components/meta-purchase";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { Eyebrow, PillLink } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { LAST_ORDER_COOKIE } from "@/lib/order-cookie";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Commande confirmée",
  robots: { index: false },
};

async function loadOrder(orderNumber: string): Promise<Order | null> {
  // Preferred path: read it back with the service role (RLS hides orders from
  // anonymous visitors on purpose).
  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data } = await admin
      .from("orders")
      .select(
        "id, order_number, email, full_name, address_line1, address_line2, city, postal_code, country, subtotal_cents, shipping_cents, total_cents, currency, status, created_at, order_items(product_name, product_slug, image, size, color, unit_cents, quantity)",
      )
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (data) return data as unknown as Order;
  }

  // Fallback: the receipt cookie written when the order was placed.
  const cookieStore = await cookies();
  const raw = cookieStore.get(LAST_ORDER_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Order & { items?: Order["order_items"] };
    if (parsed.order_number !== orderNumber) return null;
    return {
      ...parsed,
      id: parsed.order_number,
      status: parsed.status ?? "pending",
      created_at: parsed.created_at ?? new Date().toISOString(),
      order_items: parsed.order_items ?? parsed.items ?? [],
    };
  } catch {
    return null;
  }
}

export default async function OrderPage({ params }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const order = await loadOrder(number);

  if (!order) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-32 pb-24 text-center md:pt-48">
        <Eyebrow>Order {number}</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.25rem,6vw,4rem)] leading-[0.95] tracking-[-0.02em]">
          We can&apos;t find that order
        </h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-soft">
          The receipt link expired on this device. Email the studio with your order number and we&apos;ll
          resend it.
        </p>
        <div className="mt-10">
          <PillLink href="/shop">Retour aux produits</PillLink>
        </div>
      </div>
    );
  }

  const items = order.order_items ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-8 md:px-8 md:pt-28">
      {/* Browser half of the Purchase conversion; the order action already
          sent the server copy under the same event id. */}
      <MetaPurchase
        orderNumber={order.order_number}
        valueCents={order.total_cents}
        currency={order.currency}
        contents={items.map((item) => ({
          id: item.product_slug,
          quantity: item.quantity,
          unitCents: item.unit_cents,
        }))}
      />
      <Reveal className="text-center">
        <Eyebrow>Order {order.order_number}</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
          Thank you, {order.full_name.split(" ")[0]}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-soft">
          Your order is logged. We&apos;ll email {order.email} within one working day to arrange payment and
          confirm the ship date.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-14">
        <div className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
          <div className="bezel-core rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8">
            <ul className="space-y-5">
              {items.map((item, i) => (
                <li key={`${item.product_slug}-${i}`} className="flex items-center gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                    <ProductImage src={item.image} alt="" sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base leading-tight">{item.product_name}</p>
                    <p className="eyebrow mt-2 text-ink-muted">
                      {[item.size, item.color].filter(Boolean).join(" · ") || "Taille unique"} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-base tabular-nums">
                    {formatMoney(item.unit_cents * item.quantity, order.currency)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-8 space-y-3 border-t border-[color:var(--line)] pt-6 text-base">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Sous-total</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal_cents, order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Livraison</dt>
                <dd className="tabular-nums">
                  {order.shipping_cents === 0 ? "Offerte" : formatMoney(order.shipping_cents, order.currency)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-[color:var(--line)] pt-5">
                <dt className="font-display text-lg">Total</dt>
                <dd className="font-display text-2xl tabular-nums">
                  {formatMoney(order.total_cents, order.currency)}
                </dd>
              </div>
            </dl>

            <div className="mt-8 border-t border-[color:var(--line)] pt-6">
              <p className="eyebrow text-ink-muted">Livraison à</p>
              <address className="mt-3 text-base leading-relaxed text-ink-soft not-italic">
                {order.full_name}
                <br />
                {order.address_line1}
                {order.address_line2 ? (
                  <>
                    <br />
                    {order.address_line2}
                  </>
                ) : null}
                <br />
                {order.city}, {order.postal_code}
                <br />
                {order.country}
              </address>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-12 flex justify-center">
        <PillLink href="/shop" tone="paper">
          Keep browsing
        </PillLink>
      </div>
    </div>
  );
}
