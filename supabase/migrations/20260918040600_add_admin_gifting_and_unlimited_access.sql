-- DESIGNLY STUDIO — Admin gifting, unlimited access and audit trail
-- All changes are deployed through the Supabase GitHub integration.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unlimited_access boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS admin_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  gift_type text NOT NULL CHECK (gift_type IN ('full_unlock','plan')),
  plan_id text REFERENCES plans(id),
  previous_plan_id text,
  previous_credits integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked','expired')),
  granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  revoked_at timestamptz
);

ALTER TABLE admin_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_gifts" ON admin_gifts;
CREATE POLICY "admin_select_gifts" ON admin_gifts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "admin_insert_gifts" ON admin_gifts;
CREATE POLICY "admin_insert_gifts" ON admin_gifts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "admin_update_gifts" ON admin_gifts;
CREATE POLICY "admin_update_gifts" ON admin_gifts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner','admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_gifts_email ON admin_gifts(lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_gifts_target_user ON admin_gifts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_gifts_status ON admin_gifts(status);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_email text,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_audit" ON admin_audit_log;
CREATE POLICY "admin_select_audit" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS "admin_insert_audit" ON admin_audit_log;
CREATE POLICY "admin_insert_audit" ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner','admin')
    )
  );

-- Replace the signup trigger so pending admin gifts are activated automatically
-- when an invited user completes account creation.
CREATE OR REPLACE FUNCTION handle_new_user()
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
          credits = 999999,
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

-- OWNER and gifted full-unlock accounts do not consume credits.
CREATE OR REPLACE FUNCTION deduct_credits(
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
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  IF v_profile.role = 'owner' OR v_profile.unlimited_access = true THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
    VALUES (
      p_user_id,
      0,
      'generation',
      p_description || CASE WHEN v_profile.role = 'owner' THEN ' (OWNER - no deduction)' ELSE ' (GIFTED FULL UNLOCK - no deduction)' END,
      999999
    );
    RETURN true;
  END IF;

  IF v_profile.credits < p_amount THEN RETURN false; END IF;

  v_new_balance := v_profile.credits - p_amount;
  UPDATE profiles SET credits = v_new_balance, updated_at = now() WHERE id = p_user_id;
  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_amount, 'generation', p_description, v_new_balance);
  RETURN true;
END;
$$;
