import { NextResponse } from "next/server";
import { ShippingError, listCities, listDistricts } from "@/lib/shipping/intigo";

/**
 * Public region lists for the checkout forms.
 *
 * Deliberately unauthenticated: the shopper has to pick a gouvernorat and a
 * délégation before they have an account or an order. The data is Intigo's
 * public geography, the API key stays server-side, and the upstream call is
 * cached for a day so a busy shop does not hammer their API.
 */
export async function GET(request: Request) {
  const cityId = new URL(request.url).searchParams.get("city_id");

  try {
    if (cityId) {
      const id = Number(cityId);
      if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "city_id invalide" }, { status: 400 });
      }
      return NextResponse.json({ districts: await listDistricts(id) });
    }
    return NextResponse.json({ cities: await listCities() });
  } catch (error) {
    if (error instanceof ShippingError) {
      // The storefront falls back to its bundled gouvernorat list.
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
