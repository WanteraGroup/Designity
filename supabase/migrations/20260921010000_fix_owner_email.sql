-- Correct DESIGNLY owner email reference.
-- The canonical owner account is kekmajomautokozmetika@gmail.com.
-- Keep owner privileges and full unlock attached to the canonical address.
UPDATE public.profiles
SET
  role = 'owner',
  plan_id = 'owner',
  credits = 100000000,
  unlimited_access = true,
  updated_at = now()
WHERE lower(email) = lower('kekmajomautokozmetika@gmail.com');

-- Record the canonical owner address for future migrations without changing auth data.
