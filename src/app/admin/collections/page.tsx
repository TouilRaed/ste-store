import { CollectionsManager } from "@/components/admin/collections-manager";
import { PageHeading, SetupNotice } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/guard";
import { isAdminDataReady, listCollections } from "@/lib/admin/repo";

export const metadata = { title: "Catégories" };
export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  await requireAdminPage();

  if (!isAdminDataReady()) {
    return (
      <>
        <PageHeading eyebrow="Catalogue" title="Catégories" />
        <SetupNotice />
      </>
    );
  }

  const collections = await listCollections();

  return (
    <>
      <PageHeading
        eyebrow={`${collections.length} catégorie${collections.length === 1 ? "" : "s"}`}
        title="Catégories"
      />

      <CollectionsManager collections={collections} />
    </>
  );
}
