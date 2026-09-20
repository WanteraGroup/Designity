-- Admin credit gifting and standardized 100M full unlock balance.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift admin_gifts%ROWTYPE;
  v_plan_credits integer;
BEGIN
  INSERT INTO profiles (id, email, full_name, role, plan_id, credits, unlimited_access)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'free',
    10,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT *
  INTO v_gift
  FROM admin_gifts
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_gift.gift_type = 'full_unlock' THEN
      UPDATE profiles
      SET plan_id = 'owner',
          credits = 100000000,
          unlimited_access = true,
          updated_at = now()
      WHERE id = NEW.id;
    ELSE
      SELECT credits_monthly INTO v_plan_credits
      FROM plans
      WHERE id = v_gift.plan_id
        AND is_public = true;

      IF v_plan_credits IS NOT NULL THEN
        UPDATE profiles
        SET plan_id = v_gift.plan_id,
            credits = GREATEST(credits, v_plan_credits),
            updated_at = now()
        WHERE id = NEW.id;
      END IF;
    END IF;

    UPDATE admin_gifts
    SET target_user_id = NEW.id,
        status = 'active',
        activated_at = now()
    WHERE id = v_gift.id;
  END IF;

  RETURN NEW;
END;
$$;
