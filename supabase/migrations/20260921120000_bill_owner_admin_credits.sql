-- DESIGNLY: owner/admin credit billing for final generation tests
-- The Owner/Admin accounts must consume real credits so the billing path
-- can be tested end-to-end. Gifted unlimited users remain exempt.

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_new_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Owner/Admin are billable. Only explicitly gifted unlimited accounts
  -- remain exempt from normal credit consumption.
  IF v_profile.role = 'admin' THEN
    IF v_profile.credits < p_amount THEN RETURN false; END IF;
  ELSIF v_profile.role = 'owner' THEN
    IF v_profile.credits < p_amount THEN RETURN false; END IF;
  ELSIF v_profile.unlimited_access = true THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
    VALUES (
      p_user_id,
      0,
      'generation',
      p_description || ' (GIFTED FULL UNLOCK - no deduction)',
      v_profile.credits
    );
    RETURN true;
  ELSIF v_profile.credits < p_amount THEN
    RETURN false;
  END IF;

  v_new_balance := v_profile.credits - p_amount;

  UPDATE profiles
  SET credits = v_new_balance,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'generation', p_description, v_new_balance);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_credits(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
