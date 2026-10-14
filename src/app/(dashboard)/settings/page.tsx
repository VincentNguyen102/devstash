import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/account-actions";
import { getAccountSettings } from "@/lib/db/settings";

export const metadata = {
  title: "Settings · DevStash",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const settings = await getAccountSettings(session.user.id);

  // The session outlived the account (e.g. it was deleted elsewhere).
  if (!settings) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </header>

      <AccountActions hasPassword={settings.hasPassword} />
    </div>
  );
}
