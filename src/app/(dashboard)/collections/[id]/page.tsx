import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ItemCollection } from "@/components/dashboard/item-collection";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getCollectionById } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";

export default async function CollectionPage(
  props: PageProps<"/collections/[id]">
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { id } = await props.params;
  const collection = await getCollectionById(session.user.id, id);

  if (!collection) notFound();

  const items = await getItemsByCollection(session.user.id, id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{collection.name}</h1>
        {collection.description ? (
          <p className="text-muted-foreground">{collection.description}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeading title="Items" />
        {items.length > 0 ? (
          <ItemCollection items={items} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No items in this collection yet.
          </p>
        )}
      </section>
    </div>
  );
}
