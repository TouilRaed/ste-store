import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const BASE = "https://stedm.net";
const step = (n, ok, detail = "") => console.log(`${ok ? "OK  " : "KO  "} ${n}${detail ? " — " + detail : ""}`);

// 1. login, exactly as the app does
const login = await fetch(`${BASE}/api/admin/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password: env.ADMIN_PASSWORD }),
});
const loginBody = await login.json().catch(() => ({}));
step("login admin", login.ok && !!loginBody.token, `HTTP ${login.status}`);
if (!loginBody.token) process.exit(1);
const auth = { Authorization: `Bearer ${loginBody.token}` };

// 2. upload a real PNG through the same endpoint the APK uses
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mP8z/C/noEIwDiqkL4KAcLiBPkWFQ3oAAAAAElFTkSuQmCC",
  "base64",
);
const form = new FormData();
form.append("file", new Blob([png], { type: "image/png" }), `test-${Date.now()}.png`);
const up = await fetch(`${BASE}/api/admin/uploads`, { method: "POST", headers: auth, body: form });
const upBody = await up.json().catch(() => ({}));
step("upload image", up.ok && !!upBody.url, up.ok ? upBody.url : `HTTP ${up.status} ${JSON.stringify(upBody).slice(0,160)}`);
if (!upBody.url) process.exit(1);

// 3. the uploaded file must actually be served
const fetched = await fetch(upBody.url);
step("image servie", fetched.ok, `HTTP ${fetched.status}, ${fetched.headers.get("content-type")}`);

// 4. create a product carrying an option group with that photo
const create = await fetch(`${BASE}/api/admin/products`, {
  method: "POST",
  headers: { ...auth, "content-type": "application/json" },
  body: JSON.stringify({
    name: "ZZ Test E2E",
    slug: "zz-test-e2e",
    description: "Produit de vérification, supprimé juste après.",
    price_cents: 99000,
    currency: "TND",
    images: [upBody.url],
    stock: 3,
    is_active: true,
    option_groups: [{ label: "Couleur", choices: [{ name: "Test", image: upBody.url }] }],
  }),
});
const createBody = await create.json().catch(() => ({}));
const product = createBody.product ?? createBody;
step("création produit", create.ok && !!product?.id, create.ok ? `slug ${product.slug}` : `HTTP ${create.status} ${JSON.stringify(createBody).slice(0,200)}`);
if (!product?.id) process.exit(1);

// 5. it must be listed and readable by the admin, like the app's list screen
const list = await fetch(`${BASE}/api/admin/products`, { headers: auth });
const listBody = await list.json().catch(() => ({}));
const found = (listBody.products ?? []).find((p) => p.id === product.id);
step("liste admin", !!found, `${(listBody.products ?? []).length} produit(s)`);
step("options persistées", JSON.stringify(found?.option_groups ?? []).includes("Couleur"), JSON.stringify(found?.option_groups ?? []));

console.log("\nPRODUCT_ID=" + product.id);
console.log("SLUG=" + product.slug);
