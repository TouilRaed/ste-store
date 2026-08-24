import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin/api";
import { AdminError } from "@/lib/admin/repo";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const PRODUCT_BUCKET = "product-images";

const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Accepts one image and stores it in the public product bucket. Uploading runs
 * with the service role on the server, so no storage credentials reach the
 * browser or the phone — both clients just POST the file with their admin token.
 */
export const POST = withAdmin(async (request) => {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new AdminError(503, "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  // `Request.formData()` resolves to Node's FormData type here, which TS sees
  // without the DOM `get` signature — read it through a narrow shape instead.
  let file: unknown = null;
  try {
    const form = (await request.formData()) as unknown as { get(field: string): unknown };
    file = form.get("file");
  } catch {
    return NextResponse.json({ error: "Expected a multipart upload" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const extension = EXTENSION[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP or AVIF images are accepted" },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is larger than 5 MB" }, { status: 413 });
  }

  const path = `${randomUUID()}.${extension}`;

  const { error } = await admin.storage.from(PRODUCT_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[admin upload] failed:", error.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(PRODUCT_BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path }, { status: 201 });
});
