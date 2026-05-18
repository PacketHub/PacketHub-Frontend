import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Lock, KeyRound, Mail, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const checks = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "symbol", label: "One symbol (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        if (session?.user?.email) setEmail(session.user.email);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        if (data.session.user?.email) setEmail(data.session.user.email);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const results = useMemo(
    () => checks.map((c) => ({ ...c, passed: c.test(password) })),
    [password]
  );
  const allPassed = results.every((r) => r.passed);
  const matches = password.length > 0 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed) {
      toast.error("Password doesn't meet all requirements");
      return;
    }
    if (!matches) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated. Please sign in with your new password.");
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
        <div className="w-full max-w-md glass rounded-2xl p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Set a new password</h1>
          {email && (
            <div className="mt-2 flex items-center gap-2 rounded-lg glass-subtle px-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{email}</span>
            </div>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {ready
              ? "Choose a new password for your account."
              : "Open this page from the password reset link in your email."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                New password
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
                  disabled={!ready}
                  autoComplete="new-password"
                />
              </div>

              <ul className="mt-3 space-y-1.5 rounded-lg glass-subtle p-3">
                {results.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      r.passed ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {r.passed ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    )}
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="glass-subtle border-border/40 pl-10 focus:border-primary/50"
                  disabled={!ready}
                  autoComplete="new-password"
                />
              </div>
              {confirm.length > 0 && (
                <p
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    matches ? "text-primary" : "text-destructive"
                  )}
                >
                  {matches ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {matches ? "Passwords match" : "Passwords don't match"}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-display text-sm"
              disabled={loading || !ready || !allPassed || !matches}
            >
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
