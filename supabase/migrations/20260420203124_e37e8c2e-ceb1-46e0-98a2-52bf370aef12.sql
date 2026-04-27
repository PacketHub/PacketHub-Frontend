-- Audit log for role grants and revokes
CREATE TABLE public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked')),
  target_user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  actor_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_audit_log_created_at ON public.role_audit_log (created_at DESC);
CREATE INDEX idx_role_audit_log_target ON public.role_audit_log (target_user_id);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "Admins can view role audit log"
ON public.role_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE/DELETE — only the trigger writes (SECURITY DEFINER)

-- Trigger function: records who did what to whom
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.role_audit_log (action, target_user_id, role, actor_user_id)
    VALUES ('granted', NEW.user_id, NEW.role, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.role_audit_log (action, target_user_id, role, actor_user_id)
    VALUES ('revoked', OLD.user_id, OLD.role, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER user_roles_audit_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

CREATE TRIGGER user_roles_audit_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();