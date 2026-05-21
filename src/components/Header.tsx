import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Plus, LogIn, Search, MessageSquare } from "lucide-react";
import logo from "@/assets/packethub-logo.png";
import { cn } from "@/lib/utils";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialQ =
    location.pathname === "/" ? (searchParams.get("q") ?? "") : "";
  const [query, setQuery] = useState(initialQ);

  useEffect(() => {
    if (location.pathname === "/") {
      setQuery(searchParams.get("q") ?? "");
    } else {
      setQuery("");
    }
  }, [location.pathname, searchParams]);

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

        <nav className="hidden items-center gap-1 md:flex -ml-1">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
        </nav>

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
              <Link to="/profile" aria-label="Profile">
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <Avatar className="h-9 w-9 border border-border/40">
                    <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                      {user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 font-display text-xs"
              >
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
