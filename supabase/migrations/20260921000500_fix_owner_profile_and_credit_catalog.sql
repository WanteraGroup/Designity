-- DESIGNLY owner bootstrap + reliable profile persistence.
-- This migration is intentionally scoped to the existing owner account.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS unlimited_access boolean NOT NULL DEFAULT false;

-- Ensure the configured owner account has the privileges expected by the UI.
UPDATE public.profiles
SET role = 'owner',
    plan_id = 'owner',
    credits = 100000000,
    unlimited_access = true,
    updated_at = now()
WHERE lower(email) = lower('kekmajonautokozmetika@gmail.com');

-- SECURITY DEFINER RPC used by SettingsPage so profile fields persist even if
-- client-side RLS policies differ between environments.
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name text,
  p_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET full_name = NULLIF(trim(COALESCE(p_full_name, '')), ''),
      phone = NULLIF(trim(COALESCE(p_phone, '')), ''),
      updated_at = now()
  WHERE id = auth.uid();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text) TO authenticated;

-- Keep the complete credit-pack catalog available to the admin panel.
INSERT INTO public.credit_packages (id, credits, price, label, sort_order) VALUES
  ('pkg_100', 100, 2000, '100 kredit', 1),
  ('pkg_500', 500, 9500, '500 kredit', 2),
  ('pkg_1000', 1000, 11000, '1 000 kredit', 3),
  ('pkg_2500', 2500, 25000, '2 500 kredit', 4),
  ('pkg_5000', 5000, 50000, '5 000 kredit', 5),
  ('pkg_10000', 10000, 100000, '10 000 kredit', 6)
ON CONFLICT (id) DO UPDATE SET
  credits = EXCLUDED.credits,
  price = EXCLUDED.price,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;
