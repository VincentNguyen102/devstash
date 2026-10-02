import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/account-actions";
import { ProfileCard } from "@/components/profile/profile-card";
import { UsageStats } from "@/components/profile/usage-stats";
import { getProfile } from "@/lib/db/profile";

export const metadata = {
  title: "Profile · DevStash",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const profile = await getProfile(session.user.id);

  // The session outlived the account (e.g. it was deleted elsewhere).
  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and view your usage
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProfileCard
          name={profile.name}
          email={profile.email}
          image={profile.image}
          createdAt={profile.createdAt}
        />
        <div className="lg:col-span-2">
          <UsageStats
            itemCount={profile.itemCount}
            collectionCount={profile.collectionCount}
            typeCounts={profile.typeCounts}
          />
        </div>
      </div>

      <AccountActions hasPassword={profile.hasPassword} />
    </div>
  );
}
