import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin/guard";
import { AdminError, getProduct, listCollections } from "@/lib/admin/repo";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/meddm/products/[id]">) {
  await requireAdminPage();
  const { id } = await params;

  const product = await getProduct(id).catch((error) => {
    if (error instanceof AdminError && error.status === 404) notFound();
    throw error;
  });

  const collections = await listCollections();

  return (
    <>
      <Link href="/meddm/products" className="text-[13px] text-ink-soft underline underline-offset-4">
        ← Tous les produits
      </Link>
      <div className="mt-6">
        <PageHeading
          eyebrow={product.is_active ? "En ligne" : "Masqué"}
          title={product.name}
          action={
            <Link
              href={`/product/${product.slug}`}
              className="rounded-full border border-[color:var(--line-strong)] bg-white/60 px-4 py-1.5 text-[13px] text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white"
            >
              View on store
            </Link>
          }
        />
      </div>
      <ProductForm product={product} collections={collections} />
    </>
  );
}
