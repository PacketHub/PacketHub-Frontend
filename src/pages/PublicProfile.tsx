import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import RoleBadge from "@/components/RoleBadge";
import { useUserRoleByUsername } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, User, Send, Cpu, MemoryStick, HardDrive, MonitorSmartphone, Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPosts } from "@/lib/store";
import type { ForumPost } from "@/lib/types";
import type { Tables } from "@/integrations/supabase/types";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { data: topRole } = useUserRoleByUsername(username);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const displayName = profile?.display_name || profile?.username || username || "";

  const userPosts = useMemo<ForumPost[]>(() => {
    if (!profile) return [];
    const candidates = [profile.username, profile.display_name].filter(Boolean) as string[];
    const lowered = candidates.map((c) => c.toLowerCase());
    return getPosts().filter((p) => lowered.includes((p.author ?? "").toLowerCase()));
  }, [profile]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8 animate-fade-in">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading profile…</p>
        ) : notFound ? (
          <div className="glass rounded-xl border border-border p-10 text-center">
            <p className="font-display text-lg text-foreground">User not found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No profile exists for @{username}.
            </p>
          </div>
        ) : (
          <>
            {/* Banner + avatar wrapper (relative, NOT overflow-hidden so the avatar can pop out) */}
            <div className="relative mb-16">
              <div className="h-48 overflow-hidden rounded-xl border border-border bg-secondary md:h-56">
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
              <div className="absolute -bottom-12 left-6">
                <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary/20">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-secondary">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile info */}
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-display text-2xl font-semibold text-foreground">
                      {displayName}
                    </p>
                    {topRole && topRole !== "user" ? (
                      <RoleBadge role={topRole} size="md" />
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{profile?.username}
                    {profile?.created_at
                      ? ` · Member since ${new Date(profile.created_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                {user && profile && user.id !== profile.user_id && (
                  <Button
                    asChild
                    size="sm"
                    className="gap-1.5 font-display text-xs"
                  >
                    <Link to={`/messages?to=${profile.username}`}>
                      <Send className="h-3.5 w-3.5" />
                      Message
                    </Link>
                  </Button>
                )}
              </div>

              <div className="glass rounded-xl border border-border p-6">
                <h2 className="font-display text-sm font-semibold text-foreground">
                  About
                </h2>
                {profile?.bio ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="mt-2 text-sm italic text-muted-foreground/70">
                    This user hasn't written a bio yet.
                  </p>
                )}
              </div>

              {(() => {
                const p = profile as unknown as Record<string, string | null> | null;
                const specs = [
                  { key: "spec_cpu", label: "CPU", icon: Cpu, value: p?.spec_cpu },
                  { key: "spec_gpu", label: "GPU", icon: Gamepad2, value: p?.spec_gpu },
                  { key: "spec_ram", label: "RAM", icon: MemoryStick, value: p?.spec_ram },
                  { key: "spec_storage", label: "Storage", icon: HardDrive, value: p?.spec_storage },
                  { key: "spec_os", label: "OS", icon: MonitorSmartphone, value: p?.spec_os },
                ].filter((s) => (s.value ?? "").trim().length > 0);
                if (specs.length === 0) return null;
                return (
                  <div className="glass rounded-xl border border-border p-6">
                    <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                      <Cpu className="h-4 w-4 text-primary" />
                      Rig / Specs
                    </h2>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {specs.map((s) => {
                        const Icon = s.icon;
                        return (
                          <div
                            key={s.key}
                            className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3"
                          >
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <dt className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
                                {s.label}
                              </dt>
                              <dd className="mt-0.5 break-words font-mono text-xs text-foreground">
                                {s.value}
                              </dd>
                            </div>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                );
              })()}

              {/* Posts by this user */}
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Posts by {displayName}
                  <span className="font-normal text-muted-foreground">
                    ({userPosts.length})
                  </span>
                </h2>
                {userPosts.length === 0 ? (
                  <div className="glass rounded-xl border border-border p-6 text-center">
                    <p className="text-sm italic text-muted-foreground/70">
                      No posts yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;
