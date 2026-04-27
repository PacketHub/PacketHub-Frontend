import { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import RoleBadge from "@/components/RoleBadge";
import { useUserRoleByUsername } from "@/hooks/useUserRole";

interface ProfileData {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
}

interface ProfileHoverCardProps {
  username: string;
  children: ReactNode;
  /** Optional preloaded profile to avoid an extra fetch */
  initialProfile?: Partial<ProfileData> | null;
}

const ProfileHoverCard = ({ username, children, initialProfile }: ProfileHoverCardProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(
    initialProfile && initialProfile.user_id
      ? {
          user_id: initialProfile.user_id,
          username: initialProfile.username ?? username,
          display_name: initialProfile.display_name ?? null,
          avatar_url: initialProfile.avatar_url ?? null,
          banner_url: initialProfile.banner_url ?? null,
          bio: initialProfile.bio ?? null,
        }
      : null
  );
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cached via React Query — shared across PostCards, hover cards & profile pages.
  const { data: topRole } = useUserRoleByUsername(username);

  const handleOpen = async (open: boolean) => {
    if (!open || loaded || loading) return;
    setLoading(true);

    if (!profile) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, banner_url, bio")
        .eq("username", username)
        .maybeSingle();
      if (data) {
        setProfile(data as ProfileData);
      }
    }

    setLoaded(true);
    setLoading(false);
  };

  const displayName = profile?.display_name || profile?.username || username;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <HoverCard openDelay={200} closeDelay={100} onOpenChange={handleOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72 p-0 overflow-hidden glass border-border/40">
        {/* Banner */}
        <div className="relative h-20 w-full bg-muted">
          {profile?.banner_url ? (
            <img
              src={profile.banner_url}
              alt={`${displayName}'s banner`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/10" />
          )}
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-4 pb-4 -mt-8">
          <Avatar className="h-14 w-14 border-4 border-background ring-2 ring-primary/20">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-display">
              {initial}
            </AvatarFallback>
          </Avatar>

          <Link
            to={`/u/${profile?.username || username}`}
            className="mt-2 block group"
          >
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                {displayName}
              </p>
              {topRole && topRole !== "user" ? <RoleBadge role={topRole} /> : null}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
              @{profile?.username || username}
            </p>
          </Link>

          {profile?.bio ? (
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-4">
              {profile.bio}
            </p>
          ) : loaded ? (
            <p className="mt-3 text-xs text-muted-foreground/70 italic">No bio yet.</p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground/70">Loading…</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;
