-- Reliable profile persistence: keep profiles.email synchronized after a confirmed auth email change.
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_email text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = NULLIF(trim(COALESCE(p_full_name, '')), ''),
    phone = NULLIF(trim(COALESCE(p_phone, '')), ''),
    email = CASE
      WHEN p_email IS NULL OR trim(p_email) = '' THEN email
      ELSE lower(trim(p_email))
    END,
    updated_at = now()
  WHERE id = auth.uid();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text) TO authenticated;
