import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pickTopRole, type AppRole } from "@/components/RoleBadge";

/**
 * Fetches the highest-priority role for a user, identified by username.
 * Cached via React Query so multiple PostCards / hover cards / profile pages
 * for the same user share the same network request.
 */
export const useUserRoleByUsername = (username: string | null | undefined) => {
  return useQuery<AppRole | null>({
    queryKey: ["user-role", "by-username", username?.toLowerCase() ?? null],
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!username) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      if (!profile?.user_id) return null;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id);
      return pickTopRole((roles ?? []).map((r) => r.role as AppRole));
    },
  });
};

/**
 * Same as above but keyed by user_id when you already have it
 * (avoids the profile lookup round-trip).
 */
export const useUserRoleByUserId = (userId: string | null | undefined) => {
  return useQuery<AppRole | null>({
    queryKey: ["user-role", "by-id", userId ?? null],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!userId) return null;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      return pickTopRole((roles ?? []).map((r) => r.role as AppRole));
    },
  });
};
