import { notFound } from "next/navigation";

import { collections } from "@/lib/mock-data";

export function generateStaticParams() {
  return collections.map((collection) => ({ id: collection.id }));
}

export default async function CollectionPage(
  props: PageProps<"/collections/[id]">
) {
  const { id } = await props.params;
  const collection = collections.find((item) => item.id === id);

  if (!collection) notFound();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">{collection.name}</h1>
      <p className="text-muted-foreground">{collection.description}</p>
    </div>
  );
}
