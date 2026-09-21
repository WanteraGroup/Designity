-- Give administrator accounts a real 10,000,000-credit working balance.
-- Admins remain credit-metered (unlike owner/unlimited accounts), so credits
-- are actually consumed by generation/editing operations.
UPDATE public.profiles
SET credits = 10000000,
    unlimited_access = false,
    updated_at = now()
WHERE role = 'admin'
  AND credits < 10000000;
