import Link from "next/link";
import { PageHeading, SetupNotice } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin/guard";
import { isAdminDataReady, listCollections } from "@/lib/admin/repo";

export const metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Catalogue" title="New piece" />
        <SetupNotice />
      </>
    );
  }

  const collections = await listCollections();

  return (
    <>
      <Link href="/admin/products" className="text-[13px] text-ink-soft underline underline-offset-4">
        ← All products
      </Link>
      <div className="mt-6">
        <PageHeading eyebrow="Catalogue" title="New piece" />
      </div>
      <ProductForm collections={collections} />
    </>
  );
}
