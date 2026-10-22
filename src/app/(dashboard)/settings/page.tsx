import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountActions } from "@/components/profile/account-actions";
import { BillingCard } from "@/components/settings/billing-card";
import { EditorPreferencesCard } from "@/components/settings/editor-preferences-card";
import { getBillingOverview } from "@/lib/db/billing";
import { getAccountSettings } from "@/lib/db/settings";
import { intervalForPriceId } from "@/lib/stripe";

export const metadata = {
  title: "Settings · DevStash",
};

export default async function SettingsPage(props: PageProps<"/settings">) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [settings, billing] = await Promise.all([
    getAccountSettings(session.user.id),
    getBillingOverview(session.user.id),
  ]);

  // The session outlived the account (e.g. it was deleted elsewhere).
  if (!settings || !billing) {
    redirect("/sign-in");
  }

  const { checkout } = await props.searchParams;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your plan, account and editor preferences
        </p>
      </header>

      <BillingCard
        billing={billing}
        stripeInterval={intervalForPriceId(billing.stripePriceId)}
        checkoutStatus={typeof checkout === "string" ? checkout : null}
      />

      <EditorPreferencesCard />

      <AccountActions hasPassword={settings.hasPassword} />
    </div>
  );
}
