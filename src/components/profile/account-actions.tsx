import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

interface AccountActionsProps {
  /** Credential accounts have a password; GitHub-only accounts do not. */
  hasPassword: boolean;
}

/** Password and account-deletion actions for the signed-in user. */
export function AccountActions({ hasPassword }: AccountActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account actions</CardTitle>
        <CardDescription>
          Manage your sign-in method and account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Password</p>
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? "Update the password you use to sign in."
                : "You sign in with GitHub, so there is no password to change."}
            </p>
          </div>
          {hasPassword ? <ChangePasswordDialog /> : null}
        </div>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              Delete account
            </p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <DeleteAccountDialog />
        </div>
      </CardContent>
    </Card>
  );
}
