import RoleBadge from "@/components/RoleBadge";
import { useUserRoleByUsername } from "@/hooks/useUserRole";

interface AuthorNameWithRoleProps {
  username: string;
  displayName?: string | null;
  className?: string;
  badgeSize?: "sm" | "md";
}

/**
 * Renders an author's name with their highest role badge inline.
 * Uses cached React Query lookup so listing many of these doesn't hammer the DB.
 */
const AuthorNameWithRole = ({
  username,
  displayName,
  className,
  badgeSize = "sm",
}: AuthorNameWithRoleProps) => {
  const { data: topRole } = useUserRoleByUsername(username);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span>{displayName || username}</span>
      <RoleBadge role={topRole ?? "user"} size={badgeSize} />
    </span>
  );
};

export default AuthorNameWithRole;
