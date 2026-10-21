import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FavoritesView } from "@/components/dashboard/favorites-view";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

export const metadata = {
  title: "Favorites · DevStash",
};

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [items, collections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);

  return <FavoritesView items={items} collections={collections} />;
}
