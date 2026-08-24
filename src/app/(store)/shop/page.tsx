import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/ui";
import { getCollections, getProducts, type ProductFilters } from "@/lib/catalog/queries";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Shop",
  description: `Every piece in the current ${BRAND.NAME} run — tailoring, essentials, outerwear and knitwear.`,
};

const SORTS = [
  { value: "", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
] as const;

const GENDERS = [
  { value: "", label: "Everyone" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex" },
] as const;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

function buildHref(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-[15px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
        active
          ? "border-transparent bg-accent text-white"
          : "border-[color:var(--line-strong)] bg-white/60 text-ink-soft hover:bg-white"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;

  const current = {
    collection: first(params.collection),
    gender: first(params.gender),
    sort: first(params.sort),
  };

  const filters: ProductFilters = {
    collection: current.collection,
    gender: current.gender,
    sort: (current.sort as ProductFilters["sort"]) ?? "new",
  };

  const [products, collections] = await Promise.all([getProducts(filters), getCollections()]);
  const activeCollection = collections.find((c) => c.slug === current.collection);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:px-8 md:pt-28">
      <Reveal>
        <Eyebrow>{products.length} pieces in stock</Eyebrow>
        <h1 className="font-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] tracking-[-0.02em]">
          {activeCollection ? activeCollection.name : "The full run"}
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">
          {activeCollection?.tagline ??
            "Toutes les pièces disponibles. Paiement à la livraison, partout en Tunisie."}
        </p>
      </Reveal>

      {/* Filter rail */}
      <Reveal delay={100} className="mt-12">
        <div className="bezel rounded-[2rem] p-1.5 ring-1 ring-[color:var(--line)]">
          <div className="bezel-core flex flex-col gap-5 rounded-[calc(2rem-0.375rem)] bg-white/85 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-2 w-full text-ink-muted md:w-auto">Collection</span>
              <Chip href={buildHref(current, { collection: undefined })} active={!current.collection}>
                All
              </Chip>
              {collections.map((collection) => (
                <Chip
                  key={collection.id}
                  href={buildHref(current, { collection: collection.slug })}
                  active={current.collection === collection.slug}
                >
                  {collection.name}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--line)] pt-5">
              <span className="eyebrow mr-2 w-full text-ink-muted md:w-auto">Cut for</span>
              {GENDERS.map((g) => (
                <Chip
                  key={g.label}
                  href={buildHref(current, { gender: g.value || undefined })}
                  active={(current.gender ?? "") === g.value}
                >
                  {g.label}
                </Chip>
              ))}

              <span className="eyebrow mr-2 ml-0 w-full text-ink-muted md:ml-auto md:w-auto">Sort</span>
              {SORTS.map((s) => (
                <Chip
                  key={s.label}
                  href={buildHref(current, { sort: s.value || undefined })}
                  active={(current.sort ?? "") === s.value}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {products.length === 0 ? (
        <Reveal className="py-32 text-center">
          <p className="font-display text-3xl">Nothing matches that combination.</p>
          <p className="mt-4 text-base text-ink-soft">Try clearing a filter.</p>
          <Link href="/shop" className="mt-8 inline-block text-base underline underline-offset-4">
            Reset
          </Link>
        </Reveal>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 3) * 90}>
              <ProductCard product={product} priority={i < 3} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
