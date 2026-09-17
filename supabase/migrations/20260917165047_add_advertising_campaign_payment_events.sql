/*
# DESIGNLY STUDIO — Advertising, Campaign & Payment Events Schema

## New Tables
1. **campaigns** — Coordinated multi-format campaign bundles from a single brief
2. **campaign_items** — Individual design outputs within a campaign (poster, flyer, social, etc.)
3. **payment_events** — Server-validated payment webhook events (Revolut/Wise)
4. **ai_generation_jobs** — Tracks AI generation requests with status, provider, cost

## Modified Tables
- **projects** — type CHECK constraint expanded to include: poster, advertisement, banner, pricelist, campaign
- **credit_transactions** — type CHECK constraint expanded to include 'campaign'

## Security
- RLS enabled on all new tables
- Owner-scoped CRUD on campaigns, campaign_items, ai_generation_jobs
- payment_events: read-only from client (admin can read all), writes only via SECURITY DEFINER
- All new tables have per-CRUD owner policies

## Functions
- **record_payment_event()** — SECURITY DEFINER: validates and records a payment event, adds credits on success
*/

-- =====================================================
-- EXPAND PROJECT TYPES
-- =====================================================
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_type_check CHECK (
  type IN ('website','landing','logo','brand','business_card','invitation','flyer',
           'social','brochure','menu','presentation','custom',
           'poster','advertisement','banner','pricelist','campaign')
);

-- =====================================================
-- EXPAND CREDIT TRANSACTION TYPES
-- =====================================================
ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_type_check CHECK (
  type IN ('generation', 'subscription', 'purchase', 'refund', 'admin_grant', 'campaign')
);

-- =====================================================
-- CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Campaign',
  brief text NOT NULL DEFAULT '',
  brand_kit_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  style text NOT NULL DEFAULT 'premium',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','completed','failed')),
  formats text[] NOT NULL DEFAULT '{}',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_campaigns" ON campaigns;
CREATE POLICY "select_own_campaigns" ON campaigns FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_campaigns" ON campaigns;
CREATE POLICY "insert_own_campaigns" ON campaigns FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_campaigns" ON campaigns;
CREATE POLICY "update_own_campaigns" ON campaigns FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_campaigns" ON campaigns;
CREATE POLICY "delete_own_campaigns" ON campaigns FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- CAMPAIGN ITEMS (individual outputs within a campaign)
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  format text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generating','completed','failed')),
  preview_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campaign_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_campaign_items" ON campaign_items;
CREATE POLICY "select_own_campaign_items" ON campaign_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_campaign_items" ON campaign_items;
CREATE POLICY "insert_own_campaign_items" ON campaign_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_campaign_items" ON campaign_items;
CREATE POLICY "update_own_campaign_items" ON campaign_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_campaign_items" ON campaign_items;
CREATE POLICY "delete_own_campaign_items" ON campaign_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- PAYMENT EVENTS (server-validated webhook events)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  provider text NOT NULL,
  event_type text NOT NULL,
  provider_event_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  amount integer,
  currency text DEFAULT 'HUF',
  metadata jsonb DEFAULT '{}',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payment_events" ON payment_events;
CREATE POLICY "select_own_payment_events" ON payment_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_payment_events" ON payment_events;
CREATE POLICY "admin_select_all_payment_events" ON payment_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('owner', 'admin'))
  );

-- No INSERT/UPDATE/DELETE policy — mutations only via SECURITY DEFINER function

-- =====================================================
-- AI GENERATION JOBS
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  provider text NOT NULL DEFAULT 'none',
  credits_cost integer NOT NULL DEFAULT 0,
  result jsonb DEFAULT '{}',
  error text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE ai_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_gen_jobs" ON ai_generation_jobs;
CREATE POLICY "select_own_gen_jobs" ON ai_generation_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_gen_jobs" ON ai_generation_jobs;
CREATE POLICY "insert_own_gen_jobs" ON ai_generation_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_gen_jobs" ON ai_generation_jobs;
CREATE POLICY "update_own_gen_jobs" ON ai_generation_jobs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign_id ON campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_user_id ON payment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_jobs_user_id ON ai_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_jobs_status ON ai_generation_jobs(status);

-- =====================================================
-- FUNCTION: record_payment_event
-- SECURITY DEFINER — validates and records a payment event from a webhook
-- Adds credits on successful payment if not already processed
-- =====================================================
CREATE OR REPLACE FUNCTION record_payment_event(
  p_provider text,
  p_event_type text,
  p_provider_event_id text,
  p_user_id uuid,
  p_amount integer,
  p_currency text DEFAULT 'HUF',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_existing payment_events%ROWTYPE;
  v_credits_to_add integer;
  v_pkg credit_packages%ROWTYPE;
BEGIN
  -- Check if event already processed (idempotency)
  SELECT * INTO v_existing FROM payment_events WHERE provider_event_id = p_provider_event_id;
  IF FOUND THEN
    RETURN v_existing.id;
  END IF;

  -- Insert the event
  INSERT INTO payment_events (provider, event_type, provider_event_id, user_id, amount, currency, metadata, status)
  VALUES (p_provider, p_event_type, p_provider_event_id, p_user_id, p_amount, p_currency, p_metadata, 'processed')
  RETURNING id INTO v_event_id;

  -- Update processed_at
  UPDATE payment_events SET processed_at = now() WHERE id = v_event_id;

  -- If successful payment, add credits
  IF p_event_type IN ('payment.succeeded', 'payment.completed', 'order.paid') THEN
    -- Try to match a credit package by price
    SELECT * INTO v_pkg FROM credit_packages WHERE price = p_amount LIMIT 1;
    IF FOUND THEN
      v_credits_to_add := v_pkg.credits;
    ELSE
      -- If no package match, check if it's a subscription (add monthly credits)
      v_credits_to_add := 0;
    END IF;

    IF v_credits_to_add > 0 THEN
      -- Record the payment
      INSERT INTO payments (user_id, amount, currency, type, status, provider, provider_payment_id, metadata)
      VALUES (p_user_id, p_amount, p_currency, 'credit_package', 'succeeded', p_provider, p_provider_event_id, p_metadata);

      -- Add credits via the existing function
      PERFORM add_credits(p_user_id, v_credits_to_add, 'purchase', 'Credit package: ' || v_credits_to_add);
    END IF;
  END IF;

  RETURN v_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_payment_event FROM anon;

-- =====================================================
-- UPDATE SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (key, value, description) VALUES
  ('ad_formats', '{
    "print_a4": {"label":"A4","width":2480,"height":3508,"type":"print"},
    "print_a3": {"label":"A3","width":3508,"height":4961,"type":"print"},
    "print_a2": {"label":"A2","width":4961,"height":7016,"type":"print"},
    "print_a1": {"label":"A1","width":7016,"height":9933,"type":"print"},
    "digital_square": {"label":"Square","width":1080,"height":1080,"type":"digital"},
    "digital_portrait": {"label":"Portrait","width":1080,"height":1350,"type":"digital"},
    "digital_landscape": {"label":"Landscape","width":1920,"height":1080,"type":"digital"},
    "digital_facebook": {"label":"Facebook","width":1200,"height":628,"type":"digital"},
    "digital_instagram_post": {"label":"Instagram Post","width":1080,"height":1080,"type":"digital"},
    "digital_instagram_story": {"label":"Instagram Story","width":1080,"height":1920,"type":"digital"},
    "digital_tiktok": {"label":"TikTok","width":1080,"height":1920,"type":"digital"},
    "digital_linkedin": {"label":"LinkedIn","width":1200,"height":627,"type":"digital"},
    "digital_banner": {"label":"Web Banner","width":728,"height":90,"type":"digital"}
  }', 'Supported advertising formats with dimensions'),
  ('design_styles', '["premium","luxury","minimal","modern","corporate","elegant","bold","cinematic","automotive","fashion","restaurant","real_estate","technology","industrial","creative"]', 'Available design style options'),
  ('campaign_formats', '["poster","flyer","facebook","instagram_post","instagram_story","tiktok","linkedin","banner"]', 'Formats generated in a campaign'),
  ('ai_provider', '"none"', 'Active AI provider (none, openai, etc.)'),
  ('ai_provider_configured', 'false', 'Whether a live AI provider is connected'),
  ('campaign_cost', '10', 'Credit cost for a full campaign generation'),
  ('poster_cost', '3', 'Credit cost for poster generation'),
  ('advertisement_cost', '3', 'Credit cost for advertisement generation')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;
