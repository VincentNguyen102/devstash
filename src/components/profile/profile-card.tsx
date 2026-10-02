import { CalendarDays } from "lucide-react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

interface ProfileCardProps {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
}

/** Account details for the signed-in user. */
export function ProfileCard({
  name,
  email,
  image,
  createdAt,
}: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={name ?? email}
            image={image}
            className="size-16 text-lg"
          />
          <div className="min-w-0 space-y-1">
            <p className="truncate text-lg font-medium">
              {name ?? "Unnamed user"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays aria-hidden className="size-4 shrink-0" />
          <span>
            Member since{" "}
            <time
              dateTime={createdAt.toISOString()}
              className="font-medium text-foreground"
            >
              {dateFormatter.format(createdAt)}
            </time>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
