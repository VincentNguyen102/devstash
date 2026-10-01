import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Derives up to two uppercase initials from a name (e.g. "Vincent Nguyen" → "VN"). */
export function getInitials(name?: string | null): string {
  if (!name) {
    return "?";
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
}

/** Avatar that shows the user's image when available and their initials otherwise. */
export function UserAvatar({ name, image, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("size-8", className)}>
      {image ? <AvatarImage src={image} alt={name ?? "User avatar"} /> : null}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
