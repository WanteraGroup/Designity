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
  "music": 100,
  "ai_edit": 20
}',
description = 'DESIGNLY generation credit costs; AI Music is 100 credits per started minute'
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
  "music": 100,
  "ai_edit": 20
}', 'DESIGNLY generation credit costs; AI Music is 100 credits per started minute')
ON CONFLICT (key) DO NOTHING;
