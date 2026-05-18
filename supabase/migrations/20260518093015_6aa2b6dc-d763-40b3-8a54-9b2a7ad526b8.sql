ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spec_cpu text,
  ADD COLUMN IF NOT EXISTS spec_gpu text,
  ADD COLUMN IF NOT EXISTS spec_ram text,
  ADD COLUMN IF NOT EXISTS spec_storage text,
  ADD COLUMN IF NOT EXISTS spec_os text;