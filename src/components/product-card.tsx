import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { badgesFor, stockNote } from "@/lib/catalog/badges";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  className?: string;
  priority?: boolean;
};

const TONE = {
  ink: "bg-ink text-paper",
  accent: "bg-accent text-white",
  paper: "bg-white text-ink",
} as const;

/**
 * Flat rectangular tile: square corners, no card chrome, the photograph doing
 * the work. Only the first shot is shown — no hover swap.
 */
export function ProductCard({ product, className = "", priority }: ProductCardProps) {
  const onSale = product.compare_at_cents != null && product.compare_at_cents > product.price_cents;
  const badges = badgesFor(product).slice(0, 2);
  const note = stockNote(product);

  return (
    <Link href={`/product/${product.slug}`} className={`group block ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />

        {badges.length > 0 ? (
          <div className="absolute top-0 left-0 flex flex-col items-start">
            {badges.map((badge) => (
              <span key={badge.label} className={`eyebrow px-2.5 py-1.5 ${TONE[badge.tone]}`}>
                {badge.label}
              </span>
            ))}
          </div>
        ) : null}

        {note ? (
          <span className="eyebrow absolute right-0 bottom-0 bg-ink px-2.5 py-1.5 text-paper">{note}</span>
        ) : null}
      </div>

      <div className="pt-3">
        <p className="text-base leading-snug">{product.name}</p>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base whitespace-nowrap text-ink-soft tabular-nums">
            {formatMoney(product.price_cents, product.currency)}
          </span>
          {onSale ? (
            <span className="text-sm whitespace-nowrap text-ink-muted line-through tabular-nums">
              {formatMoney(product.compare_at_cents!, product.currency)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
