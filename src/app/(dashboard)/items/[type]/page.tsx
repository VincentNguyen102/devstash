import { notFound } from "next/navigation";

import { itemTypes } from "@/lib/mock-data";

export function generateStaticParams() {
  return itemTypes.map((type) => ({ type: type.id }));
}

export default async function ItemTypePage(props: PageProps<"/items/[type]">) {
  const { type } = await props.params;
  const itemType = itemTypes.find((item) => item.id === type);

  if (!itemType) notFound();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">{itemType.name}</h1>
      <p className="text-muted-foreground">{itemType.itemCount} items</p>
    </div>
  );
}
