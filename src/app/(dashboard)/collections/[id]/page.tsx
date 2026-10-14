import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionActions } from "@/components/dashboard/collection-actions";
import { ItemCollection } from "@/components/dashboard/item-collection";
import { Pagination } from "@/components/dashboard/pagination";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";
import { getCollectionById } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { parsePage } from "@/lib/pagination";

export default async function CollectionPage(
  props: PageProps<"/collections/[id]">
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { id } = await props.params;
  const { page } = await props.searchParams;

  const collection = await getCollectionById(session.user.id, id);

  if (!collection) notFound();

  const items = await getItemsByCollection(
    session.user.id,
    id,
    parsePage(page),
    COLLECTIONS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.description ? (
            <p className="text-muted-foreground">{collection.description}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {items.total} {items.total === 1 ? "item" : "items"}
          </p>
        </div>

        <CollectionActions collection={collection} />
      </header>

      <section className="space-y-4">
        <SectionHeading title="Items" />
        {items.items.length > 0 ? (
          <>
            <ItemCollection items={items.items} />
            <Pagination
              page={items.page}
              pageCount={items.pageCount}
              basePath={`/collections/${id}`}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No items in this collection yet.
          </p>
        )}
      </section>
    </div>
  );
}
