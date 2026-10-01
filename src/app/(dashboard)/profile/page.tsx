import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/user-avatar";

export const metadata = {
  title: "Profile · DevStash",
};

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="flex items-center gap-4">
        <UserAvatar name={user?.name} image={user?.image} className="size-16" />
        <div className="space-y-1">
          <p className="text-lg font-medium">{user?.name ?? "Unknown user"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}
