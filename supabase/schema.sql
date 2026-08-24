-- Storefront schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query), or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tagline     text,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  description    text not null default '',
  details        text[] not null default '{}',
  -- price stored in minor units (cents) to avoid float drift
  price_cents    int  not null check (price_cents >= 0),
  compare_at_cents int check (compare_at_cents >= 0),
  currency       text not null default 'TND',
  images         text[] not null default '{}',
  sizes          text[] not null default '{}',
  colors         text[] not null default '{}',
  collection_id  uuid references public.collections(id) on delete set null,
  gender         text not null default 'unisex' check (gender in ('women','men','unisex')),
  stock          int  not null default 0 check (stock >= 0),
  is_featured    boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists products_collection_idx on public.products (collection_id);
create index if not exists products_active_idx     on public.products (is_active);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  email         text not null,
  full_name     text not null,
  phone         text,
  address_line1 text not null,
  address_line2 text,
  city          text not null,
  postal_code   text not null,
  country       text not null,
  note          text,
  subtotal_cents int not null check (subtotal_cents >= 0),
  shipping_cents int not null default 0 check (shipping_cents >= 0),
  total_cents    int not null check (total_cents >= 0),
  currency       text not null default 'TND',
  status         text not null default 'pending'
                 check (status in ('pending','paid','shipped','delivered','cancelled')),
  user_id        uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists orders_email_idx on public.orders (email);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  image        text,
  size         text,
  color        text,
  unit_cents   int not null check (unit_cents >= 0),
  quantity     int not null check (quantity > 0),
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Catalog is public-read. Orders are insert-only for anonymous shoppers;
-- reading an order back is done from the server with the service-role key.
-- ---------------------------------------------------------------------------

alter table public.collections enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "collections are public" on public.collections;
create policy "collections are public"
  on public.collections for select
  using (true);

drop policy if exists "active products are public" on public.products;
create policy "active products are public"
  on public.products for select
  using (is_active);

drop policy if exists "anyone can place an order" on public.orders;
create policy "anyone can place an order"
  on public.orders for insert
  with check (true);

drop policy if exists "owners can read their orders" on public.orders;
create policy "owners can read their orders"
  on public.orders for select
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "anyone can add order items" on public.order_items;
create policy "anyone can add order items"
  on public.order_items for insert
  with check (true);

drop policy if exists "owners can read their order items" on public.order_items;
create policy "owners can read their order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and auth.uid() is not null
        and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Admin devices — Expo push tokens for the mobile app.
-- Written and read only with the service role, so RLS denies everyone else.
-- ---------------------------------------------------------------------------

create table if not exists public.admin_devices (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  platform    text not null default 'unknown',
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

alter table public.admin_devices enable row level security;
-- No policies: with RLS on and none defined, anon and authenticated get nothing.

-- Staff-only note on an order, kept separate from the customer's own note.
alter table public.orders add column if not exists admin_note text;

-- ---------------------------------------------------------------------------
-- Cash on delivery: orders can arrive from the product page with a phone
-- number and no email, so email becomes optional and the payment method is
-- recorded explicitly.
-- ---------------------------------------------------------------------------

alter table public.orders alter column email drop not null;

alter table public.orders
  add column if not exists payment_method text not null default 'manual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method in ('manual', 'cod'));
  end if;
end $$;

-- Prices moved from US cents to Tunisian millimes (1 DT = 1000 millimes).
alter table public.products alter column currency set default 'TND';
alter table public.orders   alter column currency set default 'TND';

-- Merchandising tags shown as badges on the card and product page
-- (e.g. Nouveau, Édition limitée, Promo). Free-form so the shop can invent its own.
alter table public.products add column if not exists tags text[] not null default '{}';
