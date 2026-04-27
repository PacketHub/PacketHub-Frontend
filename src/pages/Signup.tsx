import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Mail, Lock, User, UserPlus, Shield, Cpu } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !username.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: username.trim(),
          display_name: displayName.trim() || username.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to verify.");
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
                Join the<br />
                <span className="text-primary">PacketHub</span> community
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Connect with IT enthusiasts, share your knowledge, and level up your skills.
              </p>
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3 rounded-lg glass-subtle px-4 py-3">
                <Cpu className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Hardware, networking, and OS discussions</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg glass-subtle px-4 py-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Safe space for beginners and experts</span>
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
            <h1 className="font-display text-xl font-bold text-foreground">Create Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Fill in your details to get started</p>

            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                    Username *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="coolhacker42"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={30}
                      className="glass-subtle border-border/40 pl-10 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    className="glass-subtle border-border/40 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                  Email *
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
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-subtle border-border/40 pl-10 focus:border-primary/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-display text-sm"
                disabled={loading}
              >
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
