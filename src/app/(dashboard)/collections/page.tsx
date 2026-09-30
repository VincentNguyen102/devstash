import { CollectionCard } from "@/components/dashboard/collection-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getCollections } from "@/lib/db/collections";

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">
          All of your collections in one place
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeading title="All Collections" />
        {collections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        )}
      </section>
    </div>
  );
}
