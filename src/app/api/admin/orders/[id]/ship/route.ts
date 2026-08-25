import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAdmin } from "@/lib/admin/api";
import { getOrder, markShipped } from "@/lib/admin/repo";
import {
  ShippingError,
  createParcelByName,
  defaultPickupIndex,
} from "@/lib/shipping/intigo";

type Context = { params: Promise<{ id: string }> };

const shipSchema = z.object({
  city_name: z.string().trim().min(1),
  district_name: z.string().trim().min(1),
  neighborhood_name: z.string().trim().optional(),
  // Omitted by the UI: resolved from the account, since Intigo indexes are
  // 1-based and a hardcoded 0 points at no pickup address at all.
  pickup_index: z.coerce.number().int().min(0).optional(),
  package_size: z.coerce.number().int().min(1).max(7).default(1),
});

/**
 * Books one order with Intigo and stores the NID it returns.
 *
 * Refuses an order that already carries a tracking code: Intigo has no
 * idempotency key here, so a second call books a second parcel — another
 * driver, another delivery fee.
 */
export const POST = withAdmin(async (request, { params }: Context) => {
  const { id } = await params;
  const order = await getOrder(id);

  if (order.tracking_code) {
    return NextResponse.json(
      { error: `Déjà expédiée — colis ${order.tracking_code}.` },
      { status: 409 },
    );
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Commande annulée." }, { status: 409 });
  }

  if (!order.phone) {
    return NextResponse.json(
      { error: "Intigo exige un téléphone ; cette commande n'en a pas." },
      { status: 400 },
    );
  }

  const parsed = shipSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ville et délégation sont requises.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const pickupIndex = parsed.data.pickup_index ?? (await defaultPickupIndex());

    const { nid } = await createParcelByName({
      order,
      cityName: parsed.data.city_name,
      districtName: parsed.data.district_name,
      neighborhoodName: parsed.data.neighborhood_name,
      pickupIndex,
      packageSize: parsed.data.package_size,
    });

    const updated = await markShipped(id, "intigo", nid);
    return NextResponse.json({ order: updated, trackingCode: nid });
  } catch (error) {
    if (error instanceof ShippingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
});
