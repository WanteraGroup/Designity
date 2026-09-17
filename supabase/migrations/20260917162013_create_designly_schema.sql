/*
# DESIGNLY STUDIO — Core Schema

Creates the complete database architecture for the DESIGNLY STUDIO AI design platform.

## New Tables (in dependency order)
1. **profiles** — User profile data linked to auth.users, storing role, plan, and credits
2. **plans** — Subscription plan definitions (Free, Starter, Pro, Business, Agency, OWNER)
3. **credit_packages** — Purchasable credit bundles
4. **credit_transactions** — Audit log of all credit changes
5. **subscriptions** — User subscription state
6. **payments** — Payment records with provider-agnostic architecture
7. **brands** — Brand Kits (colors, fonts, tone, style keywords)
8. **projects** — User design projects (references brands)
9. **project_assets** — Generated/exported assets per project
10. **templates** — Template library entries
11. **system_settings** — Admin-configurable system-wide settings

## Security
- RLS enabled on ALL tables
- Owner-scoped CRUD on user data (projects, brands, profiles, etc.)
- Admin can read all profiles, transactions, payments for the admin panel
- credit_transactions and payments: read-only from client, mutations via SECURITY DEFINER functions
- system_settings: readable by all, writable only by admin/owner

## Functions (SECURITY DEFINER)
- **handle_new_user()** — Auto-creates a profile row on signup
- **deduct_credits()** — Atomically deducts credits and logs a transaction (no-op for owner role)
- **refund_credits()** — Restores credits after a failed generation
- **add_credits()** — Adds purchased credits after successful payment
*/

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  plan_id text NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'starter', 'pro', 'business', 'agency', 'owner')),
  credits integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly integer NOT NULL DEFAULT 0,
  credits_monthly integer NOT NULL DEFAULT 0,
  project_limit integer NOT NULL DEFAULT 0,
  features text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_public_plans" ON plans;
CREATE POLICY "select_public_plans" ON plans FOR SELECT
  TO anon, authenticated USING (is_public = true);

DROP POLICY IF EXISTS "admin_manage_plans" ON plans;
CREATE POLICY "admin_manage_plans" ON plans FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- CREDIT PACKAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_packages (
  id text PRIMARY KEY,
  credits integer NOT NULL,
  price integer NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_credit_packages" ON credit_packages;
CREATE POLICY "select_credit_packages" ON credit_packages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_packages" ON credit_packages;
CREATE POLICY "admin_manage_packages" ON credit_packages FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- CREDIT TRANSACTIONS (append-only audit log)
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('generation', 'subscription', 'purchase', 'refund', 'admin_grant')),
  description text NOT NULL DEFAULT '',
  balance_after integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON credit_transactions;
CREATE POLICY "select_own_transactions" ON credit_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_transactions" ON credit_transactions;
CREATE POLICY "admin_select_all_transactions" ON credit_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  provider text NOT NULL DEFAULT 'none',
  provider_subscription_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_subscriptions" ON subscriptions;
CREATE POLICY "admin_select_all_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'HUF',
  type text NOT NULL CHECK (type IN ('subscription', 'credit_package')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  provider text NOT NULL DEFAULT 'none',
  provider_payment_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_payments" ON payments;
CREATE POLICY "admin_select_all_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- BRANDS (Brand Kits) — must exist before projects references it
-- =====================================================
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Brand',
  industry text NOT NULL DEFAULT '',
  colors text[] NOT NULL DEFAULT '{}',
  fonts jsonb NOT NULL DEFAULT '{"heading":"Inter","body":"Inter"}',
  tone text NOT NULL DEFAULT '',
  logo_url text,
  style_keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_brands" ON brands;
CREATE POLICY "select_own_brands" ON brands FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_brands" ON brands;
CREATE POLICY "insert_own_brands" ON brands FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_brands" ON brands;
CREATE POLICY "update_own_brands" ON brands FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_brands" ON brands;
CREATE POLICY "delete_own_brands" ON brands FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- PROJECTS (references brands)
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled',
  type text NOT NULL DEFAULT 'custom' CHECK (type IN ('website','landing','logo','brand','business_card','invitation','flyer','social','brochure','menu','presentation','custom')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','completed','failed')),
  brief text NOT NULL DEFAULT '',
  brand_kit_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  preview_url text,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- PROJECT ASSETS
-- =====================================================
CREATE TABLE IF NOT EXISTS project_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Asset',
  type text NOT NULL DEFAULT 'image' CHECK (type IN ('image','file','export')),
  url text,
  format text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assets" ON project_assets;
CREATE POLICY "select_own_assets" ON project_assets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assets" ON project_assets;
CREATE POLICY "insert_own_assets" ON project_assets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assets" ON project_assets;
CREATE POLICY "update_own_assets" ON project_assets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assets" ON project_assets;
CREATE POLICY "delete_own_assets" ON project_assets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  thumbnail_url text,
  premium boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_templates" ON templates;
CREATE POLICY "select_all_templates" ON templates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_templates" ON templates;
CREATE POLICY "admin_manage_templates" ON templates FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- SYSTEM SETTINGS (admin-configurable)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_settings" ON system_settings;
CREATE POLICY "select_settings" ON system_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_settings" ON system_settings;
CREATE POLICY "admin_manage_settings" ON system_settings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_user_id ON project_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- =====================================================
-- FUNCTION: handle_new_user — auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, plan_id, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'free',
    10
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FUNCTION: deduct_credits — atomic deduction + transaction log
-- Owner role: no deduction (unlimited)
-- =====================================================
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

  IF v_profile.role = 'owner' THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
    VALUES (p_user_id, 0, 'generation', p_description || ' (OWNER - no deduction)', 999999);
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

-- =====================================================
-- FUNCTION: refund_credits — restore credits after failed generation
-- =====================================================
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT 'Refund: failed generation'
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
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_profile.role = 'owner' THEN RETURN true; END IF;

  v_new_balance := v_profile.credits + p_amount;
  UPDATE profiles SET credits = v_new_balance, updated_at = now() WHERE id = p_user_id;
  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, p_amount, 'refund', p_description, v_new_balance);
  RETURN true;
END;
$$;

-- =====================================================
-- FUNCTION: add_credits — add purchased credits after successful payment
-- =====================================================
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'purchase',
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
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_profile.role = 'owner' THEN RETURN true; END IF;

  v_new_balance := v_profile.credits + p_amount;
  UPDATE profiles SET credits = v_new_balance, updated_at = now() WHERE id = p_user_id;
  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, v_new_balance);
  RETURN true;
END;
$$;

-- =====================================================
-- SEED DATA: PLANS (OWNER plan is_public=false — hidden from pricing)
-- =====================================================
INSERT INTO plans (id, name, price_monthly, credits_monthly, project_limit, features, is_public, sort_order) VALUES
  ('free', 'Free', 0, 10, 3, ARRAY['10 credits / month','3 projects','Basic exports (PNG, JPG)','Community support'], true, 1),
  ('starter', 'Starter', 2990, 50, 15, ARRAY['50 credits / month','15 projects','All export formats','Email support','Commercial usage'], true, 2),
  ('pro', 'Pro', 7990, 200, 60, ARRAY['200 credits / month','60 projects','All export formats','Brand Kits','Priority support','Commercial usage'], true, 3),
  ('business', 'Business', 14990, 500, 200, ARRAY['500 credits / month','200 projects','All export formats','Unlimited Brand Kits','Team collaboration','Priority support'], true, 4),
  ('agency', 'Agency', 29990, 1500, 1000, ARRAY['1,500 credits / month','1,000 projects','All export formats','Unlimited Brand Kits','Team collaboration','Dedicated manager','API access'], true, 5),
  ('owner', 'OWNER', 0, 999999, 999999, ARRAY['Unlimited credits','Unlimited projects','Unlimited exports','All premium features','Admin access'], false, 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  credits_monthly = EXCLUDED.credits_monthly,
  project_limit = EXCLUDED.project_limit,
  features = EXCLUDED.features,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;

-- =====================================================
-- SEED DATA: CREDIT PACKAGES
-- =====================================================
INSERT INTO credit_packages (id, credits, price, label, sort_order) VALUES
  ('pkg_100', 100, 2990, '100 credits', 1),
  ('pkg_500', 500, 9990, '500 credits', 2),
  ('pkg_1000', 1000, 16990, '1,000 credits', 3),
  ('pkg_2500', 2500, 34990, '2,500 credits', 4)
ON CONFLICT (id) DO UPDATE SET
  credits = EXCLUDED.credits,
  price = EXCLUDED.price,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- =====================================================
-- SEED DATA: SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (key, value, description) VALUES
  ('generation_costs', '{
    "social": 2, "business_card": 2, "invitation": 2, "flyer": 2, "menu": 2,
    "logo": 3, "brand": 5, "landing": 5, "brochure": 5, "presentation": 5,
    "website": 10, "custom": 10, "ai_edit": 1
  }', 'Credit costs per generation type'),
  ('supported_languages', '["en","hu","de","fr","es","it","pl","uk","ro","nl"]', 'Supported language codes'),
  ('payment_provider', '"none"', 'Active payment provider (none, stripe, etc.)'),
  ('payment_provider_configured', 'false', 'Whether a live payment provider is connected')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- =====================================================
-- SEED DATA: TEMPLATES
-- =====================================================
INSERT INTO templates (name, category, type, premium, sort_order) VALUES
  ('Luxury Barber', 'Beauty', 'brand', true, 1),
  ('Fine Dining', 'Restaurant', 'website', true, 2),
  ('Modern Clinic', 'Business', 'website', false, 3),
  ('Elite Fitness', 'Fitness', 'landing', true, 4),
  ('Tech Startup', 'Technology', 'landing', false, 5),
  ('Premium Real Estate', 'Real Estate', 'website', true, 6),
  ('Wedding Classic', 'Wedding', 'invitation', true, 7),
  ('Event Promo', 'Events', 'flyer', false, 8),
  ('Boutique Store', 'E-commerce', 'website', false, 9),
  ('Corporate Pro', 'Corporate', 'presentation', true, 10),
  ('Marketing Agency', 'Marketing', 'landing', true, 11),
  ('Personal Portfolio', 'Personal', 'website', false, 12)
ON CONFLICT DO NOTHING;
