import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { CodOrderForm } from "@/components/cod-order-form";
import { AddToCart, ProductGallery } from "@/components/product-purchase";
import { Reveal } from "@/components/reveal";
import { Eyebrow, PillLink } from "@/components/ui";
import { badgesFor, stockNote } from "@/lib/catalog/badges";
import { getCollections, getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Introuvable" };
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, collections] = await Promise.all([getRelatedProducts(product), getCollections()]);
  const collection = collections.find((c) => c.id === product.collection_id);
  const onSale = product.compare_at_cents != null && product.compare_at_cents > product.price_cents;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8 md:pt-28">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <Reveal>
          <ProductGallery product={product} />
        </Reveal>

        <Reveal delay={120} className="md:pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow>{collection?.name ?? BRAND.NAME}</Eyebrow>
            {badgesFor(product).map((badge) => (
              <Eyebrow key={badge.label} className={badge.tone === "accent" ? "text-accent-deep" : ""}>
                {badge.label}
              </Eyebrow>
            ))}
            {stockNote(product) ? <Eyebrow className="text-accent-deep">{stockNote(product)}</Eyebrow> : null}
          </div>

          <h1 className="font-display mt-6 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] tracking-[-0.02em]">
            {product.name}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-xl tabular-nums">{formatMoney(product.price_cents, product.currency)}</p>
            {onSale ? (
              <p className="text-base text-ink-muted line-through tabular-nums">
                {formatMoney(product.compare_at_cents!, product.currency)}
              </p>
            ) : null}
          </div>

          <p className="mt-8 max-w-md text-base leading-relaxed text-ink-soft">{product.description}</p>

          <AddToCart product={product} />

          <div className="mt-10">
            <CodOrderForm product={product} />
          </div>

          <div className="mt-14 border-t border-[color:var(--line)] pt-8">
            <p className="eyebrow text-ink-muted">Caractéristiques</p>
            <ul className="mt-5 space-y-3">
              {product.details.map((detail) => (
                <li key={detail} className="flex gap-3 text-base text-ink-soft">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {related.length > 0 ? (
        <section className="pt-32 md:pt-48">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Même catégorie</Eyebrow>
              <h2 className="font-display mt-5 text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-[-0.02em]">
                À voir aussi
              </h2>
            </div>
            <PillLink href={`/shop?collection=${collection?.slug ?? ""}`} tone="paper">
              Tout {collection?.name ?? "voir"}
            </PillLink>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            {related.map((item, i) => (
              <Reveal key={item.id} delay={i * 90}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
