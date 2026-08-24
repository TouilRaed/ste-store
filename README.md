# Storefront — clothing storefront + admin

Next.js 16 (App Router) + Tailwind v4 + Supabase. Editorial-luxury storefront for a small-run
clothing label: catalogue, filtering, product pages, cart, checkout, and order confirmation.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

The site works immediately with **no credentials** — it falls back to the bundled demo catalogue in
`src/lib/catalog/fallback.ts`. Add Supabase env vars and every query switches to Postgres.

## Wire up Supabase

1. Create a project at [supabase.com](https://supabase.com) (or `npx supabase projects create`).
2. Dashboard → **SQL Editor** → paste and run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Dashboard → **Project Settings → API**, copy the keys into `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...     # server-only, never commit

   ADMIN_PASSWORD=...                # unlocks /admin and the mobile app
   ADMIN_JWT_SECRET=...              # openssl rand -base64 32
   ```

4. Create the photo bucket: `npm run storage:setup`
5. Restart `npm run dev`. The storefront now reads products from Postgres and writes real orders.

### Data model

| Table         | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| `collections` | Atelier / Everyday / Outerwear / Knitwear                            |
| `products`    | Catalogue. Prices in **minor units** (`price_cents`) — no float drift |
| `orders`      | Order header + shipping address, `status` enum                       |
| `order_items` | One row per variant, with the name/price captured at purchase time   |

RLS is on for all four tables: the catalogue is public-read, anonymous visitors may **insert**
orders but not read them back. The confirmation page reads the order with the service-role key
(server-side only); without that key it falls back to an httpOnly receipt cookie.

### Editing the catalogue

`src/lib/catalog/fallback.ts` is the source of truth for the demo data. After editing it:

```bash
npm run seed:sql     # regenerates supabase/seed.sql from the TS catalogue
```

Once you're on real Supabase data, edit products in `/admin` (or the mobile app) instead — the
fallback file is only used when credentials are missing.

## Structure

```
src/
  app/
    (store)/                 Storefront group — its own header/footer/cart chrome
      page.tsx               Home — editorial split hero, bento, collections, rail
      shop/                  Catalogue + collection/gender/sort filters (URL-driven)
      product/[slug]/        Gallery, variant picker, spec, related pieces
      cart/                  Bag (localStorage, per-variant lines)
      checkout/              Address form → placeOrder server action
      order/[number]/        Receipt
    actions/orders.ts        Server action: re-prices server-side, writes order + items
    admin/                   Admin tab — dashboard, orders, products (password-gated)
    api/admin/               Same operations as JSON, for the mobile app
  proxy.ts                   CORS for /api/admin/* (browser-origin admin clients)
  components/                Header, footer, cards, gallery, reveal, toast, UI primitives
  lib/
    catalog/queries.ts       Supabase reads with demo-data fallback
    cart/cart-context.tsx    Cart state + localStorage persistence
    supabase/                Browser, server (cookie-aware) and admin clients
  lib/admin/                 Auth (JWT), repo (service-role queries), zod schemas
supabase/
  schema.sql                 Tables, indexes, RLS policies
  seed.sql                   Generated demo catalogue
mobile/                      Expo admin app — see mobile/README.md
```

## Admin

`/admin` is a password-gated tab on the same site: dashboard, orders (with status changes), and
full product CRUD. Sign in at `/admin/login` with `ADMIN_PASSWORD`; the session is a signed JWT in
an httpOnly cookie, good for 30 days.

The same operations are exposed as JSON under `/api/admin/*` for the Expo app in `mobile/`, which
authenticates with `Authorization: Bearer <jwt>` from `POST /api/admin/login`. Both clients share
one verifier, one set of zod schemas, and one repository layer.

Everything admin-side reads and writes through the Supabase **service-role** key on the server, so
RLS never blocks it and the key never reaches a browser or a phone. Login is rate limited (5 tries
per minute per IP on the API).

| Endpoint | Methods |
| -------- | ------- |
| `/api/admin/login` | `POST` — password → token |
| `/api/admin/stats` | `GET` |
| `/api/admin/orders` | `GET` (`?status=`, `?search=`) |
| `/api/admin/orders/[id]` | `GET`, `PATCH` (status) |
| `/api/admin/products` | `GET`, `POST` |
| `/api/admin/products/[id]` | `GET`, `PATCH`, `DELETE` |
| `/api/admin/collections` | `GET` |
| `/api/admin/uploads` | `POST` — multipart image → Supabase Storage URL |

## Notes on the build

- **Prices are never trusted from the client.** Checkout sends slugs and quantities only; the server
  action re-reads prices and recomputes the total before inserting.
- **Motion** is `transform`/`opacity` only, driven by `IntersectionObserver` (no scroll listeners).
  `backdrop-blur` is limited to the fixed nav and menu overlay. Everything respects
  `prefers-reduced-motion`.
- **Images**: product photos upload from either admin client to the public `product-images` bucket in
  Supabase Storage (5 MB cap, JPEG/PNG/WebP/AVIF, service-role write on the server only). The seeded
  demo pieces still point at Unsplash; `ProductImage` degrades to a woven-paper gradient if any remote
  shot fails.

## Not built yet

- Payments — checkout records the order and promises a follow-up email. Add Stripe (or a Vercel
  Marketplace payments integration) at `src/app/actions/orders.ts` when you want live charges.
- Accounts / order history — the `orders.user_id` column and RLS policies are already in place for
  Supabase Auth.
- Push notifications for new orders — would need `expo-notifications` plus a device registry table.
- Collections CRUD — the four collections are seeded by SQL; products can be reassigned between
  them from either admin client.
