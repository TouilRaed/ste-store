import Link from "next/link";
import { PageHeading, SetupNotice } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin/guard";
import { isAdminDataReady, listCollections } from "@/lib/admin/repo";

export const metadata = { title: "Nouveau produit" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Catalogue" title="Nouvelle pièce" />
        <SetupNotice />
      </>
    );
  }

  const collections = await listCollections();

  return (
    <>
      <Link href="/meddm/products" className="text-[13px] text-ink-soft underline underline-offset-4">
        ← Tous les produits
      </Link>
      <div className="mt-6">
        <PageHeading eyebrow="Catalogue" title="Nouvelle pièce" />
      </div>
      <ProductForm collections={collections} />
    </>
  );
}
