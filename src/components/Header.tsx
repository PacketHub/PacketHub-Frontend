import { Link, NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Plus, LogIn, User, LogOut, Shield, Search, Home, MessageSquare } from "lucide-react";
import { useUserRoleByUserId } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import RoleBadge from "@/components/RoleBadge";
import logo from "@/assets/packethub-logo.png";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, signOut } = useAuth();
  const { data: topRole } = useUserRoleByUserId(user?.id);
  const isAdmin = topRole === "admin";

  // Cached profile fetch for the header avatar
  const { data: profile } = useQuery({
    queryKey: ["header-profile", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, banner_url, bio")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialQ = location.pathname === "/" ? searchParams.get("q") ?? "" : "";
  const [query, setQuery] = useState(initialQ);

  // Keep input in sync when the URL ?q= changes (or when leaving home)
  useEffect(() => {
    if (location.pathname === "/") {
      setQuery(searchParams.get("q") ?? "");
    } else {
      setQuery("");
    }
  }, [location.pathname, searchParams]);

  const userLabel =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.username ||
    user?.email ||
    "Account";

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-xs transition-colors",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 glass-strong">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src={logo}
            alt="PacketHub logo"
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="hidden font-display text-lg font-semibold tracking-tight text-foreground sm:inline">
            PacketHub
          </span>
        </Link>

        {/* Nav links with active state */}
        <nav className="hidden items-center gap-1 md:flex -ml-1">
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              <Shield className="h-3.5 w-3.5" />
              Admin
            </NavLink>
          )}
        </nav>

        {/* Search bar - centered */}
        <form
          onSubmit={handleSearch}
          className="relative mx-auto w-full max-w-md"
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts, tags, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="glass border-border/40 pl-9 h-9 text-sm"
            aria-label="Search posts"
          />
        </form>

        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <Link to="/new">
                <Button size="sm" className="gap-1.5 font-display text-xs">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Post</span>
                </Button>
              </Link>
              <Link to="/messages" aria-label="Messages">
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open profile menu"
                    className="rounded-full ring-2 ring-transparent hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-primary/60 transition"
                  >
                    <Avatar className="h-9 w-9 border border-border/40">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={userLabel} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                        {(profile?.display_name || profile?.username || user.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                  {/* Banner */}
                  <div className="relative h-24 w-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10">
                    {profile?.banner_url ? (
                      <img
                        src={profile.banner_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  {/* Avatar overlapping banner */}
                  <div className="px-4 -mt-10">
                    <Avatar className="h-20 w-20 border-4 border-popover shadow-md">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={userLabel} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-xl">
                        {(profile?.display_name || profile?.username || user.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Identity */}
                  <div className="px-4 pt-2 pb-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-base font-semibold text-foreground truncate">
                        {profile?.display_name || profile?.username || userLabel}
                      </p>
                      {topRole && topRole !== "user" ? (
                        <RoleBadge role={topRole} />
                      ) : null}
                    </div>
                    {profile?.username ? (
                      <p className="text-xs text-muted-foreground truncate">
                        @{profile.username}
                      </p>
                    ) : null}
                  </div>

                  {/* About me */}
                  {profile?.bio ? (
                    <div className="px-4 pb-3">
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                        About me
                      </p>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words">
                        {profile.bio}
                      </p>
                    </div>
                  ) : null}

                  <div className="border-t border-border/40" />

                  {profile?.username ? (
                    <DropdownMenuItem asChild>
                      <Link to={`/u/${profile.username}`} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        View public profile
                      </Link>
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" className="gap-1.5 font-display text-xs">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
