-- DESIGNLY competitive pricing: slightly below comparable AI design/site-builder tiers.
UPDATE public.plans SET price_monthly = 2490 WHERE id = 'starter';
UPDATE public.plans SET price_monthly = 6990 WHERE id = 'pro';
UPDATE public.plans SET price_monthly = 12990 WHERE id = 'business';
UPDATE public.plans SET price_monthly = 24990 WHERE id = 'agency';
UPDATE public.plans SET price_monthly = 49990 WHERE id = 'ultimate';

-- Credit packs: simple, transparent volume pricing.
UPDATE public.credit_packages SET price = 2000 WHERE id = 'pkg_100';
UPDATE public.credit_packages SET price = 8000 WHERE id = 'pkg_500';
UPDATE public.credit_packages SET price = 11000 WHERE id = 'pkg_1000';
UPDATE public.credit_packages SET price = 25000 WHERE id = 'pkg_2500';
UPDATE public.credit_packages SET price = 50000 WHERE id = 'pkg_5000';
UPDATE public.credit_packages SET price = 100000 WHERE id = 'pkg_10000';
