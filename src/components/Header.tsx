import { Link, NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Plus, LogIn, User, LogOut, Shield, Search, Home } from "lucide-react";
import { useUserRoleByUserId } from "@/hooks/useUserRole";
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
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            <Home className="h-3.5 w-3.5" />
            Home
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              <Shield className="h-3.5 w-3.5" />
              Admin
            </NavLink>
          )}
        </nav>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="relative ml-auto flex-1 max-w-sm md:ml-2"
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

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link to="/new">
                <Button size="sm" className="gap-1.5 font-display text-xs">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Post</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                    <span className="truncate text-sm">{userLabel}</span>
                    {topRole && topRole !== "user" ? (
                      <RoleBadge role={topRole} />
                    ) : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
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
