import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin/api";
import { ShippingError, listCities, listDistricts } from "@/lib/shipping/intigo";

/**
 * Proxies Intigo's region lists to the admin UI so the API key never reaches
 * the browser. Without `city_id` it lists cities; with it, that city's
 * districts.
 */
export const GET = withAdmin(async (request) => {
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
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
});
