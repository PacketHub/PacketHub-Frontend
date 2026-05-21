import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, User } from "lucide-react";

export type AppRole = "admin" | "moderator" | "user";

const ROLE_PRIORITY: Record<AppRole, number> = {
  admin: 3,
  moderator: 2,
  user: 1,
};

export const pickTopRole = (roles: AppRole[]): AppRole | null => {
  if (!roles.length) return null;
  return roles.reduce(
    (best, r) => (ROLE_PRIORITY[r] > ROLE_PRIORITY[best] ? r : best),
    roles[0],
  );
};

interface RoleBadgeProps {
  role: AppRole;
  size?: "sm" | "md";
}

const RoleBadge = ({ role, size = "sm" }: RoleBadgeProps) => {
  const sizing =
    size === "md"
      ? "px-2 py-0.5 text-xs gap-1.5"
      : "px-1.5 py-0 text-[10px] gap-1";
  const iconSize = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";

  if (role === "admin") {
    return (
      <Badge
        className={`bg-primary/15 text-primary hover:bg-primary/20 border-primary/30 font-display ${sizing}`}
      >
        <ShieldCheck className={iconSize} />
        Admin
      </Badge>
    );
  }
  if (role === "moderator") {
    return (
      <Badge
        className={`bg-accent/15 text-accent hover:bg-accent/20 border-accent/30 font-display ${sizing}`}
      >
        <Shield className={iconSize} />
        Mod
      </Badge>
    );
  }
  return (
    <Badge
      className={`bg-muted/40 text-muted-foreground hover:bg-muted/60 border-border font-display ${sizing}`}
    >
      <User className={iconSize} />
      User
    </Badge>
  );
};

export default RoleBadge;
