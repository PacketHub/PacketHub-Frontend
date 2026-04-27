import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Mail, Lock, LogIn, Terminal, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
        <div className="grid w-full max-w-4xl gap-0 overflow-hidden rounded-2xl lg:grid-cols-2">
          {/* Left panel — branding */}
          <div className="relative hidden flex-col justify-between overflow-hidden glass-strong p-10 lg:flex">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10" />
            <div className="relative z-10">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
                PH
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold text-foreground">
                Welcome back to<br />
                <span className="text-primary">PacketHub</span>
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Your go-to community for IT discussions, troubleshooting, and knowledge sharing.
              </p>
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3 rounded-lg glass-subtle px-4 py-3">
                <Terminal className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">8 categories from networking to overclocking</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg glass-subtle px-4 py-3">
                <ArrowRight className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Beginner-friendly community</span>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="glass p-8 lg:p-10">
            <div className="mb-8 lg:hidden text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
                PH
              </div>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Sign In</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-subtle border-border/40 pl-10 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-subtle border-border/40 pl-10 focus:border-primary/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-display text-sm"
                disabled={loading}
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
