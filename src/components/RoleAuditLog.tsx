import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { History, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole } from "@/components/RoleBadge";

interface AuditRow {
  id: string;
  action: "granted" | "revoked";
  target_user_id: string;
  actor_user_id: string | null;
  role: AppRole;
  created_at: string;
}

interface ProfileLite {
  user_id: string;
  username: string;
  display_name: string | null;
}

const RoleAuditLog = ({ enabled }: { enabled: boolean }) => {
  const auditQuery = useQuery<AuditRow[]>({
    queryKey: ["admin", "role_audit_log"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_audit_log")
        .select("id, action, target_user_id, actor_user_id, role, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const rows = auditQuery.data ?? [];

  // Look up usernames for everyone referenced in the log in one query.
  const userIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      set.add(r.target_user_id);
      if (r.actor_user_id) set.add(r.actor_user_id);
    }
    return [...set];
  }, [rows]);

  const profilesQuery = useQuery<ProfileLite[]>({
    queryKey: ["admin", "audit_profiles", userIds.sort().join(",")],
    enabled: enabled && userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("user_id", userIds);
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
  });

  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileLite>();
    for (const p of profilesQuery.data ?? []) map.set(p.user_id, p);
    return map;
  }, [profilesQuery.data]);

  const renderUser = (id: string | null, fallback: string) => {
    if (!id) return <span className="text-muted-foreground italic">{fallback}</span>;
    const p = profileMap.get(id);
    if (!p) {
      return (
        <span className="text-xs text-muted-foreground font-mono">
          {id.slice(0, 8)}…
        </span>
      );
    }
    return (
      <Link
        to={`/u/${p.username}`}
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        @{p.username}
      </Link>
    );
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Role Audit Log
        </h2>
        <span className="text-xs text-muted-foreground">
          (last {rows.length} {rows.length === 1 ? "entry" : "entries"})
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Action</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Performed by</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  Loading audit log…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No role changes recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.action === "granted" ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Granted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                        <ShieldOff className="h-3.5 w-3.5" />
                        Revoked
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.role === "admin" ? "default" : "secondary"}
                    >
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderUser(row.target_user_id, "unknown")}</TableCell>
                  <TableCell>{renderUser(row.actor_user_id, "system")}</TableCell>
                  <TableCell
                    className="text-right text-xs text-muted-foreground"
                    title={new Date(row.created_at).toLocaleString()}
                  >
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default RoleAuditLog;
