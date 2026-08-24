import Link from "next/link";
import type { Metadata } from "next";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { PillLink } from "@/components/ui";
import { getProducts } from "@/lib/catalog/queries";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Toutes les pièces en images — cliquez sur une photo pour commander.",
};

export const dynamic = "force-dynamic";

/** Every shot in the catalogue, biggest first, each one shoppable. */
export default async function LookbookPage() {
  const products = await getProducts({});

  const shots = products.flatMap((product) =>
    product.images.map((image, index) => ({
      key: `${product.id}-${index}`,
      image,
      product,
      /** The first shot of each piece gets the wide slot. */
      wide: index === 0 && product.is_featured,
    })),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 md:px-8 md:pt-16">
      <div className="max-w-2xl">
        <h1 className="text-[clamp(2.25rem,6vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em] uppercase">
          Lookbook
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-soft">
          Chaque pièce photographiée, portée et à plat. Cliquez sur une image pour voir la fiche et
          commander en paiement à la livraison.
        </p>
      </div>

      {shots.length === 0 ? (
        <p className="mt-16 text-base text-ink-soft">Aucune photo pour le moment.</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {shots.map((shot, i) => (
            <Reveal
              key={shot.key}
              delay={(i % 3) * 70}
              className={shot.wide ? "col-span-2 md:col-span-2" : ""}
            >
              <Link
                href={`/product/${shot.product.slug}`}
                className="group block overflow-hidden rounded-2xl bg-paper-deep ring-1 ring-[color:var(--line)]"
              >
                <div className={`relative ${shot.wide ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
                  <ProductImage
                    src={shot.image}
                    alt={shot.product.name}
                    priority={i < 3}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />

                  {/* Caption rides in on hover — the image stays the point. */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/65 to-transparent p-4 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100">
                    <span className="text-sm font-medium text-white">{shot.product.name}</span>
                    <span className="text-sm whitespace-nowrap text-white/85 tabular-nums">
                      {formatMoney(shot.product.price_cents, shot.product.currency)}
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-16 flex justify-center">
        <PillLink href="/shop">Voir la boutique</PillLink>
      </div>
    </div>
  );
}
