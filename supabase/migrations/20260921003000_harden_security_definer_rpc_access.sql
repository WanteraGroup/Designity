-- DESIGNLY security hardening for SECURITY DEFINER RPCs.
-- Client-callable credit deduction is bound to the authenticated user.
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
  v_profile public.profiles%ROWTYPE;
  v_new_balance integer;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.role() <> 'service_role' AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Cannot deduct credits for another user';
  END IF;

  IF p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  IF v_profile.role = 'owner' OR v_profile.unlimited_access = true THEN
    INSERT INTO public.credit_transactions (user_id, amount, type, description, balance_after)
    VALUES (
      p_user_id,
      0,
      'generation',
      COALESCE(p_description, '') ||
        CASE WHEN v_profile.role = 'owner'
          THEN ' (OWNER - no deduction)'
          ELSE ' (GIFTED FULL UNLOCK - no deduction)'
        END,
      v_profile.credits
    );
    RETURN true;
  END IF;

  IF v_profile.credits < p_amount THEN RETURN false; END IF;

  v_new_balance := v_profile.credits - p_amount;
  UPDATE public.profiles
  SET credits = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'generation', COALESCE(p_description, ''), v_new_balance);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.add_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_payment_event(text, text, text, uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_credits(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_my_profile(text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text) TO authenticated;
