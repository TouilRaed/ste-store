import { NextResponse } from "next/server";
import { readJson, withAdmin } from "@/lib/admin/api";
import { createProduct, listProducts } from "@/lib/admin/repo";
import { productInputSchema } from "@/lib/admin/schemas";

export const GET = withAdmin(async (request) => {
  const url = new URL(request.url);
  const active = url.searchParams.get("active");

  const products = await listProducts({
    search: url.searchParams.get("search") ?? undefined,
    active: active === null ? undefined : active === "true",
  });

  return NextResponse.json({ products });
});

export const POST = withAdmin(async (request) => {
  const parsed = productInputSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ product: await createProduct(parsed.data) }, { status: 201 });
});
