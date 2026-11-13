import { FavoritesView } from "@/components/dashboard/favorites-view";
import { verifySession } from "@/lib/dal";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

export const metadata = {
  title: "Favorites · DevStash",
};

export default async function FavoritesPage() {
  const session = await verifySession();

  const [items, collections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);

  return <FavoritesView items={items} collections={collections} />;
}
