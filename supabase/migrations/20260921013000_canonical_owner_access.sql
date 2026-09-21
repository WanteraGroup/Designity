-- Canonical DESIGNLY owner access.
-- The owner identity is the authenticated account email, not a historical migration typo.
CREATE OR REPLACE FUNCTION public.ensure_my_owner_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), ''));
BEGIN
  IF v_email <> 'kekmajomautokozmetika@gmail.com' THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET
    email = 'kekmajomautokozmetika@gmail.com',
    role = 'owner',
    plan_id = 'owner',
    credits = GREATEST(COALESCE(credits, 0), 100000000),
    unlimited_access = true,
    updated_at = now()
  WHERE id = auth.uid();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_owner_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_owner_access() TO authenticated;
