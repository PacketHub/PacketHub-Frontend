import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield, Search, ShieldOff, ShieldCheck, ShieldPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole } from "@/components/RoleBadge";
import { pickTopRole } from "@/components/RoleBadge";
import RoleAuditLog from "@/components/RoleAuditLog";

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface RoleRow {
  user_id: string;
  role: AppRole;
}

interface MutationVars {
  userId: string;
  username: string;
  role: AppRole;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Check admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      });
  }, [user, authLoading]);

  // Profiles + roles via React Query so the table reflects shared cache.
  const profilesQuery = useQuery<Profile[]>({
    queryKey: ["admin", "profiles"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .order("username", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const rolesQuery = useQuery<RoleRow[]>({
    queryKey: ["admin", "user_roles"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

  const profiles = profilesQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const loading = profilesQuery.isLoading || rolesQuery.isLoading;

  const rolesByUser = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    for (const r of roles) {
      const list = map.get(r.user_id) ?? [];
      list.push(r.role);
      map.set(r.user_id, list);
    }
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.display_name ?? "").toLowerCase().includes(q),
    );
  }, [profiles, search]);

  // Invalidate every cached role lookup for this user across the app.
  const invalidateForUser = (userId: string, username: string) => {
    queryClient.invalidateQueries({ queryKey: ["user-role", "by-id", userId] });
    queryClient.invalidateQueries({
      queryKey: ["user-role", "by-username", username.toLowerCase()],
    });
  };

  // Optimistically apply a roles-array change in the admin cache.
  const optimisticUpdateRoles = (
    userId: string,
    update: (current: AppRole[]) => AppRole[],
  ) => {
    queryClient.setQueryData<RoleRow[]>(["admin", "user_roles"], (old) => {
      const list = old ?? [];
      const others = list.filter((r) => r.user_id !== userId);
      const mine = list.filter((r) => r.user_id === userId).map((r) => r.role);
      const next = update(mine);
      const nextRows: RoleRow[] = next.map((role) => ({ user_id: userId, role }));
      return [...others, ...nextRows];
    });
  };

  const grantMutation = useMutation({
    mutationFn: async ({ userId, role }: MutationVars) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "user_roles"] });
      const previous = queryClient.getQueryData<RoleRow[]>(["admin", "user_roles"]);
      optimisticUpdateRoles(userId, (current) =>
        current.includes(role) ? current : [...current, role],
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["admin", "user_roles"], ctx.previous);
      }
      toast.error((err as Error).message || "Failed to grant role");
    },
    onSuccess: (_data, vars) => {
      toast.success(`Granted ${vars.role} to @${vars.username}`);
      invalidateForUser(vars.userId, vars.username);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "role_audit_log"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ userId, role }: MutationVars) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "user_roles"] });
      const previous = queryClient.getQueryData<RoleRow[]>(["admin", "user_roles"]);
      optimisticUpdateRoles(userId, (current) => current.filter((r) => r !== role));
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["admin", "user_roles"], ctx.previous);
      }
      toast.error((err as Error).message || "Failed to revoke role");
    },
    onSuccess: (_data, vars) => {
      toast.success(`Revoked ${vars.role} from @${vars.username}`);
      invalidateForUser(vars.userId, vars.username);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "role_audit_log"] });
    },
  });

  const grantRole = (p: Profile, role: AppRole) => {
    const existing = rolesByUser.get(p.user_id) ?? [];
    if (existing.includes(role)) {
      toast.info(`@${p.username} already has ${role}`);
      return;
    }
    grantMutation.mutate({ userId: p.user_id, username: p.username, role });
  };

  const revokeRole = (p: Profile, role: AppRole) => {
    if (role === "admin" && p.user_id === user?.id) {
      toast.error("You can't remove your own admin role");
      return;
    }
    revokeMutation.mutate({ userId: p.user_id, username: p.username, role });
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage user roles across PacketHub
            </p>
          </div>
        </div>

        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-[180px]">Moderator</TableHead>
                <TableHead className="w-[180px] text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    Loading users…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const userRoles = rolesByUser.get(p.user_id) ?? [];
                  const hasAdmin = userRoles.includes("admin");
                  const hasMod = userRoles.includes("moderator");
                  const isSelf = p.user_id === user.id;
                  const top = pickTopRole(userRoles);
                  return (
                    <TableRow key={p.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={p.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {(p.display_name ?? p.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {p.display_name ?? p.username}
                              {isSelf && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{p.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {userRoles.length === 0 ? (
                            <Badge variant="outline">none</Badge>
                          ) : (
                            userRoles.map((r) => (
                              <Badge
                                key={r}
                                variant={
                                  r === "admin"
                                    ? "default"
                                    : r === "moderator"
                                      ? "secondary"
                                      : "outline"
                                }
                                className={
                                  r === top
                                    ? "ring-1 ring-primary/40"
                                    : undefined
                                }
                              >
                                {r}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasMod ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => revokeRole(p, "moderator")}
                            disabled={revokeMutation.isPending}
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            Revoke mod
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            onClick={() => grantRole(p, "moderator")}
                            disabled={grantMutation.isPending}
                          >
                            <ShieldPlus className="h-3.5 w-3.5" />
                            Make mod
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={isSelf || revokeMutation.isPending}
                            onClick={() => revokeRole(p, "admin")}
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            Revoke admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5"
                            onClick={() => grantRole(p, "admin")}
                            disabled={grantMutation.isPending}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Make admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <RoleAuditLog enabled={!!isAdmin} />
      </main>
    </div>
  );
};

export default Admin;
