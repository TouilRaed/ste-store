import Link from "next/link";
import { PageHeading, Panel, SetupNotice } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { PillLink } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { isAdminDataReady, listProducts } from "@/lib/admin/repo";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Produits" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Catalogue" title="Produits" />
        <SetupNotice />
      </>
    );
  }

  const products = await listProducts();

  return (
    <>
      <PageHeading
        eyebrow={`${products.length} produit${products.length === 1 ? "" : "s"}`}
        title="Produits"
        action={<PillLink href="/admin/products/new">Nouvelle pièce</PillLink>}
      />

      <Panel>
        {products.length === 0 ? (
          <p className="p-8 text-sm text-ink-soft">Aucun produit — ajoutez le premier.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-paper-deep/60"
                >
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                    <ProductImage src={product.images[0]} alt="" sizes="48px" className="object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base leading-tight">{product.name}</p>
                    <p className="eyebrow mt-2 text-ink-muted">
                      {product.gender} · {product.slug}
                    </p>
                  </div>

                  {!product.is_active ? (
                    <span className="eyebrow rounded-full bg-paper-sand px-3 py-1 text-ink-muted">Masqué</span>
                  ) : null}
                  {product.is_featured ? (
                    <span className="eyebrow rounded-full bg-accent-soft px-3 py-1 text-accent-deep">
                      Mis en avant
                    </span>
                  ) : null}

                  <span
                    className={`eyebrow rounded-full px-3 py-1 ${
                      product.stock > 0 ? "bg-[#e7efe4] text-sage" : "bg-accent-soft text-accent-deep"
                    }`}
                  >
                    {product.stock > 0 ? "Disponible" : "Rupture"}
                  </span>

                  <span className="w-20 text-right text-sm tabular-nums">
                    {formatMoney(product.price_cents, product.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
