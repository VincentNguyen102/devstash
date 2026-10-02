import { notFound } from "next/navigation";

import { ItemCard } from "@/components/dashboard/item-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { getItemTypeById, getItemsByType } from "@/lib/db/items";

export default async function ItemTypePage(props: PageProps<"/items/[type]">) {
  const { type } = await props.params;

  const [itemType, items] = await Promise.all([
    getItemTypeById(type),
    getItemsByType(type),
  ]);

  if (!itemType) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{itemType.name}</h1>
        <p className="text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeading title={`All ${itemType.name}`} />
        {items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No {itemType.name.toLowerCase()} yet.
          </p>
        )}
      </section>
    </div>
  );
}
