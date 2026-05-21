import { ShieldCheck } from "lucide-react";

const RoleAuditLog = ({ enabled }: { enabled: boolean }) => {
  if (!enabled) return null;
  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground">
        Role audit log is not available
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The Supabase backend has been removed, so admin role history is disabled
        in this demo.
      </p>
    </section>
  );
};

export default RoleAuditLog;
