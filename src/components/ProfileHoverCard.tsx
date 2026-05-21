import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileHoverCardProps {
  username: string;
  children: ReactNode;
  /** Optional preloaded profile to avoid an extra fetch */
  initialProfile?: {
    username?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    bio?: string | null;
  } | null;
}

const ProfileHoverCard = ({
  username,
  children,
  initialProfile,
}: ProfileHoverCardProps) => {
  const displayName =
    initialProfile?.display_name || initialProfile?.username || username;
  const avatarUrl = initialProfile?.avatar_url;
  const bannerUrl = initialProfile?.banner_url;
  const bio = initialProfile?.bio;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72 p-0 overflow-hidden glass border-border/40">
        <div className="relative h-20 w-full bg-muted">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={`${displayName}'s banner`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/10" />
          )}
        </div>

        <div className="px-4 pb-4 -mt-8">
          <Avatar className="h-14 w-14 border-4 border-background ring-2 ring-primary/20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-display">
              {initial}
            </AvatarFallback>
          </Avatar>

          <Link
            to={`/u/${initialProfile?.username || username}`}
            className="mt-2 block group"
          >
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                {displayName}
              </p>
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
              @{initialProfile?.username || username}
            </p>
          </Link>

          {bio ? (
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-4">
              {bio}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground/70 italic">
              No profile details available.
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;
