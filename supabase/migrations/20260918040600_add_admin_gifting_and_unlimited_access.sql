-- Add Ultimate to the public plan catalog and extend the profile plan constraint.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_id_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_id_check
  CHECK (plan_id IN ('free','starter','pro','business','agency','ultimate','owner'));

INSERT INTO plans (id, name, price_monthly, credits_monthly, project_limit, features, is_public, sort_order)
VALUES (
  'ultimate',
  'Ultimate',
  59990,
  5000,
  5000,
  ARRAY[
    '5,000 credits / month',
    '5,000 projects',
    'All export formats',
    'Unlimited Brand Kits',
    'Team collaboration',
    'Priority support',
    'API access',
    'All premium features'
  ],
  true,
  6
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  credits_monthly = EXCLUDED.credits_monthly,
  project_limit = EXCLUDED.project_limit,
  features = EXCLUDED.features,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;

-- Allow admins to gift Ultimate as a normal paid plan.
