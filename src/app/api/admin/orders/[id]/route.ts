import { NextResponse } from "next/server";
import { readJson, withAdmin } from "@/lib/admin/api";
import { deleteOrder, getOrder, updateOrder } from "@/lib/admin/repo";
import { orderUpdateSchema } from "@/lib/admin/schemas";

type Context = { params: Promise<{ id: string }> };

export const GET = withAdmin(async (_request, { params }: Context) => {
  const { id } = await params;
  return NextResponse.json({ order: await getOrder(id) });
});

/** Removes the order and its lines. The app asks the operator first. */
export const DELETE = withAdmin(async (_request, { params }: Context) => {
  const { id } = await params;
  await deleteOrder(id);
  return NextResponse.json({ ok: true });
});

export const PATCH = withAdmin(async (request, { params }: Context) => {
  const { id } = await params;
  const parsed = orderUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order patch", issues: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ order: await updateOrder(id, parsed.data) });
});
