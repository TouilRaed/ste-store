import { NextResponse } from "next/server";
import { readJson, withAdmin } from "@/lib/admin/api";
import { setOrderItems } from "@/lib/admin/repo";
import { orderItemsSchema } from "@/lib/admin/schemas";

type Context = { params: Promise<{ id: string }> };

/** Replaces every line on the order and recomputes subtotal, shipping, total. */
export const PUT = withAdmin(async (request, { params }: Context) => {
  const { id } = await params;

  const parsed = orderItemsSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid items", issues: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({ order: await setOrderItems(id, parsed.data.items) });
});
