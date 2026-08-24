/**
 * Applies supabase/schema.sql (and by default supabase/seed.sql) to the
 * Postgres database named by the environment.
 *
 *   npm run db:push            # schema + seed
 *   npm run db:push -- --no-seed
 *
 * Connection string is read from POSTGRES_URL / DATABASE_URL / SUPABASE_DB_URL
 * — whichever the Supabase integration wrote into .env.local.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = /^([A-Z0-9_]+)=(.*)$/i.exec(line.trim());
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env.local — fall back to the ambient environment.
  }
}

loadEnvLocal();

const url =
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL;

if (!url) {
  console.error(
    "No database URL found. Run `vercel env pull` (or set POSTGRES_URL) before pushing the schema.",
  );
  process.exit(1);
}

const withSeed = !process.argv.includes("--no-seed");
const files = ["supabase/schema.sql", ...(withSeed ? ["supabase/seed.sql"] : [])];

// Supabase signs database certificates with its own root CA, so the system
// trust store can't verify them. Pin their published root instead of turning
// verification off — `supabase/prod-ca-2021.crt` comes from
// https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
// (also downloadable from Project Settings → Database → SSL configuration).
const ca = readFileSync(join(root, "supabase", "prod-ca-2021.crt"), "utf8");

// The connection string carries `sslmode=require`, which node-postgres turns
// into its own (unverified) TLS config and which wins over a `ssl` option
// passed alongside `connectionString`. Take the URL apart so our verified
// config is the only one in play.
const parsed = new URL(url);

const client = new pg.Client({
  host: parsed.hostname,
  port: Number(parsed.port || 5432),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "postgres",
  ssl: { ca, rejectUnauthorized: true, servername: parsed.hostname },
});

await client.connect();

try {
  for (const file of files) {
    const sql = readFileSync(join(root, file), "utf8");
    process.stdout.write(`→ ${file} … `);
    await client.query(sql);
    console.log("ok");
  }

  const { rows } = await client.query(
    "select (select count(*) from public.products) as products, (select count(*) from public.collections) as collections",
  );
  console.log(`✓ ${rows[0].products} products, ${rows[0].collections} collections`);
} catch (error) {
  console.error("\n✗ Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
