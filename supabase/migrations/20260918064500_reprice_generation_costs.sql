UPDATE public.system_settings
SET value = '{
  "social": 100,
  "business_card": 150,
  "invitation": 150,
  "flyer": 200,
  "menu": 200,
  "pricelist": 200,
  "poster": 250,
  "logo": 300,
  "advertisement": 300,
  "brochure": 450,
  "brand": 600,
  "presentation": 600,
  "landing": 1000,
  "campaign": 1500,
  "custom": 2000,
  "website": 3000,
  "ai_edit": 20
}',
description = 'DESIGNLY generation credit costs: Social Post is the 1000 Ft entry-level generation at the 10 Ft/credit floor'
WHERE key = 'generation_costs';

INSERT INTO public.system_settings (key, value, description)
VALUES ('generation_costs', '{
  "social": 100,
  "business_card": 150,
  "invitation": 150,
  "flyer": 200,
  "menu": 200,
  "pricelist": 200,
  "poster": 250,
  "logo": 300,
  "advertisement": 300,
  "brochure": 450,
  "brand": 600,
  "presentation": 600,
  "landing": 1000,
  "campaign": 1500,
  "custom": 2000,
  "website": 3000,
  "ai_edit": 20
}', 'DESIGNLY generation credit costs: Social Post is the 1000 Ft entry-level generation at the 10 Ft/credit floor')
ON CONFLICT (key) DO NOTHING;
