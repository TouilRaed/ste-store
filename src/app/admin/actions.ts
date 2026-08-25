"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  SESSION_SECONDS,
  hasAdminCookie,
  isAdminConfigured,
  issueToken,
  verifyPassword,
} from "@/lib/admin/auth";
import { rateLimit } from "@/lib/admin/rate-limit";
import {
  AdminError,
  createProduct,
  deleteProduct,
  setOrderItems,
  updateOrder,
  updateOrderStatus,
  updateProduct,
} from "@/lib/admin/repo";
import {
  orderItemsSchema,
  orderPatchSchema,
  orderUpdateSchema,
  productInputSchema,
  productPatchSchema,
} from "@/lib/admin/schemas";
import { majorInputToMinor } from "@/lib/format";

export type ActionResult = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };

async function requireAdmin() {
  if (!(await hasAdminCookie())) throw new AdminError(401, "Non autorisé");
}

function toMessage(error: unknown): string {
  if (error instanceof AdminError) return error.message;
  console.error("[admin action]", error);
  return "Erreur serveur inattendue";
}

export async function adminLogin(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!isAdminConfigured()) {
    return { ok: false, error: "Admin is not configured. Set ADMIN_PASSWORD and ADMIN_JWT_SECRET." };
  }

  // Server actions have no request object; throttle on the session cookie jar
  // identity instead, which still slows down repeated guesses from one client.
  const limit = rateLimit("admin-login:web", 10, 60_000);
  if (!limit.ok) return { ok: false, error: "Trop de tentatives. Réessayez dans un instant." };

  const password = String(formData.get("password") ?? "");
  if (!password || !verifyPassword(password)) return { ok: false, error: "Mot de passe incorrect" };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, await issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  redirect("/admin");
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function saveProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    // The form asks for dinars; the columns store minor units.
    const currency = String(formData.get("currency") ?? "TND").trim() || "TND";
    // Price is required: a blank must fail validation, not coerce to 0.
    const priceMinor = majorInputToMinor(formData.get("price_dinars"), currency) ?? Number.NaN;
    const compareMinor = majorInputToMinor(formData.get("compare_at_dinars"), currency);
    const raw = {
      slug: formData.get("slug"),
      name: formData.get("name"),
      description: formData.get("description"),
      details: formData.get("details"),
      price_cents: priceMinor,
      compare_at_cents: compareMinor,
      currency: formData.get("currency"),
      images: formData.get("images"),
      sizes: formData.get("sizes"),
      colors: formData.get("colors"),
      collection_id: formData.get("collection_id"),
      gender: formData.get("gender"),
      stock: formData.get("stock"),
      tags: formData.get("tags"),
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") === "on",
      offers: formData.get("offers"),
    };

    const schema = id ? productPatchSchema : productInputSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Vérifiez les champs en surbrillance.", fieldErrors: parsed.error.flatten().fieldErrors };
    }

    if (id) await updateProduct(id, parsed.data);
    else await createProduct(parsed.data as Parameters<typeof createProduct>[0]);
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function setOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = orderPatchSchema.safeParse({ status: formData.get("status") });
  if (!id || !parsed.success) return;

  await updateOrderStatus(id, parsed.data.status);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { ok: false, error: "Commande introuvable" };

    const text = (key: string) => {
      const value = String(formData.get(key) ?? "").trim();
      return value.length > 0 ? value : null;
    };

    const parsed = orderUpdateSchema.safeParse({
      full_name: text("full_name") ?? undefined,
      email: text("email") ?? undefined,
      phone: text("phone"),
      address_line1: text("address_line1") ?? undefined,
      address_line2: text("address_line2"),
      city: text("city") ?? undefined,
      postal_code: text("postal_code") ?? undefined,
      country: text("country") ?? undefined,
      note: text("note"),
      admin_note: text("admin_note"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: "Vérifiez les champs en surbrillance.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await updateOrder(id, parsed.data);
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Saves the edited lines of an order. The form posts them as JSON because a
 * variable-length list of rows doesn't map onto flat form fields.
 */
export async function updateOrderItemsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { ok: false, error: "Commande introuvable" };

    let payload: unknown = null;
    try {
      payload = JSON.parse(String(formData.get("items") ?? "[]"));
    } catch {
      return { ok: false, error: "Impossible de lire ces lignes." };
    }

    const parsed = orderItemsSchema.safeParse({ items: payload });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Vérifiez les lignes." };
    }

    await setOrderItems(id, parsed.data.items);
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
