-- Owner/admin-only generation cost management.
CREATE OR REPLACE FUNCTION public.get_generation_costs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN COALESCE(
    (SELECT value FROM public.system_settings WHERE key = 'generation_costs'),
    '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_generation_costs(p_value jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_value IS NULL OR jsonb_typeof(p_value) <> 'object' THEN
    RAISE EXCEPTION 'Invalid cost catalog';
  END IF;

  INSERT INTO public.system_settings(key, value, description, updated_at)
  VALUES (
    'generation_costs',
    p_value,
    'Credit costs per generation type',
    now()
  )
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.get_generation_costs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_generation_costs(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_generation_costs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_generation_costs(jsonb) TO authenticated;
