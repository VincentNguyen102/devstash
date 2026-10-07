import { notFound } from "next/navigation";

import { ItemCollection } from "@/components/dashboard/item-collection";
import { ItemCreateDialog } from "@/components/dashboard/item-create-dialog";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { Button } from "@/components/ui/button";
import { getItemTypeById, getItemsByType } from "@/lib/db/items";
import { CREATE_TYPE_LABELS, getTypeVisual } from "@/lib/item-type-meta";
import { isCreateItemTypeId } from "@/lib/validations/item";

export default async function ItemTypePage(props: PageProps<"/items/[type]">) {
  const { type } = await props.params;

  const [itemType, items] = await Promise.all([
    getItemTypeById(type),
    getItemsByType(type),
  ]);

  if (!itemType) notFound();

  const canCreate = isCreateItemTypeId(type);
  const { Icon: CreateIcon, textClass: createTextClass } = getTypeVisual(type);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{itemType.name}</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {canCreate ? (
          <ItemCreateDialog
            defaultTypeId={type}
            trigger={
              <Button size="lg" className="shrink-0">
                <CreateIcon aria-hidden className={createTextClass} />
                New {CREATE_TYPE_LABELS[type]}
              </Button>
            }
          />
        ) : null}
      </header>

      <section className="space-y-4">
        <SectionHeading title={`All ${itemType.name}`} />
        {items.length > 0 ? (
          <ItemCollection typeId={type} items={items} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No {itemType.name.toLowerCase()} yet.
          </p>
        )}
      </section>
    </div>
  );
}
