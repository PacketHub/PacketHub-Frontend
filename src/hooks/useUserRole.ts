import { useQuery } from "@tanstack/react-query";
import { type AppRole } from "@/components/RoleBadge";

export const useUserRoleByUsername = (username: string | null | undefined) => {
  return useQuery<AppRole | null>({
    queryKey: ["user-role", "by-username", username?.toLowerCase() ?? null],
    enabled: false,
    queryFn: async () => null,
  });
};

export const useUserRoleByUserId = (userId: string | null | undefined) => {
  return useQuery<AppRole | null>({
    queryKey: ["user-role", "by-id", userId ?? null],
    enabled: false,
    queryFn: async () => null,
  });
};
