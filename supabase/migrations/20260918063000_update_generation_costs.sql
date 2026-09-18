UPDATE public.system_settings
SET value = '{
  "social": 3,
  "business_card": 4,
  "invitation": 4,
  "flyer": 4,
  "menu": 4,
  "pricelist": 4,
  "logo": 10,
  "poster": 6,
  "advertisement": 8,
  "brand": 25,
  "landing": 30,
  "brochure": 15,
  "presentation": 20,
  "website": 60,
  "campaign": 40,
  "custom": 50,
  "ai_edit": 2
}',
description = 'Premium DESIGNLY credit costs by workload complexity'
WHERE key = 'generation_costs';

INSERT INTO public.system_settings (key, value, description)
VALUES ('generation_costs', '{
  "social": 3,
  "business_card": 4,
  "invitation": 4,
  "flyer": 4,
  "menu": 4,
  "pricelist": 4,
  "logo": 10,
  "poster": 6,
  "advertisement": 8,
  "brand": 25,
  "landing": 30,
  "brochure": 15,
  "presentation": 20,
  "website": 60,
  "campaign": 40,
  "custom": 50,
  "ai_edit": 2
}', 'Premium DESIGNLY credit costs by workload complexity')
ON CONFLICT (key) DO NOTHING;
