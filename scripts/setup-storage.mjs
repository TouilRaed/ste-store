/**
 * Creates the public bucket that product photos are uploaded into.
 *
 *   npm run storage:setup
 *
 * Idempotent: re-running only updates the bucket's limits.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/i.exec(line.trim());
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // Fall back to the ambient environment.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run `vercel env pull` first.");
  process.exit(1);
}

export const BUCKET = "product-images";

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const options = {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
};

const { data: existing } = await admin.storage.getBucket(BUCKET);

if (existing) {
  const { error } = await admin.storage.updateBucket(BUCKET, options);
  if (error) {
    console.error("✗ Could not update bucket:", error.message);
    process.exit(1);
  }
  console.log(`✓ Bucket "${BUCKET}" already existed — limits refreshed`);
} else {
  const { error } = await admin.storage.createBucket(BUCKET, options);
  if (error) {
    console.error("✗ Could not create bucket:", error.message);
    process.exit(1);
  }
  console.log(`✓ Created public bucket "${BUCKET}" (5 MB max, images only)`);
}
