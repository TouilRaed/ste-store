import { NextResponse } from "next/server";
import { readJson, withAdmin } from "@/lib/admin/api";
import { deleteProduct, getProduct, updateProduct } from "@/lib/admin/repo";
import { productPatchSchema } from "@/lib/admin/schemas";

type Context = { params: Promise<{ id: string }> };

export const GET = withAdmin(async (_request, { params }: Context) => {
  const { id } = await params;
  return NextResponse.json({ product: await getProduct(id) });
});

export const PATCH = withAdmin(async (request, { params }: Context) => {
  const { id } = await params;
  const parsed = productPatchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ product: await updateProduct(id, parsed.data) });
});

export const DELETE = withAdmin(async (_request, { params }: Context) => {
  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
});
