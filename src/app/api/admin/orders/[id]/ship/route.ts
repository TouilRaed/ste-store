import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin/api";
import { getOrder, markShipped } from "@/lib/admin/repo";
import { ShippingError, createIntigoShipment } from "@/lib/shipping/intigo";

type Context = { params: Promise<{ id: string }> };

/**
 * Hands one order to Intigo and records the tracking code it returns.
 *
 * Deliberately not idempotent-by-accident: an order that already carries a
 * tracking code is refused rather than booked a second time, because a double
 * booking means a second driver and a second delivery fee.
 */
export const POST = withAdmin(async (_request, { params }: Context) => {
  const { id } = await params;
  const order = await getOrder(id);

  if (order.tracking_code) {
    return NextResponse.json(
      { error: `Déjà expédiée — suivi ${order.tracking_code}.` },
      { status: 409 },
    );
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Commande annulée." }, { status: 409 });
  }

  try {
    const { trackingCode } = await createIntigoShipment(order);
    const updated = await markShipped(id, "intigo", trackingCode);
    return NextResponse.json({ order: updated, trackingCode });
  } catch (error) {
    if (error instanceof ShippingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
});
