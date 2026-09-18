UPDATE public.system_settings
SET value = jsonb_set(
  COALESCE(value::jsonb, '{}'::jsonb),
  '{music}',
  '100'::jsonb,
  true
),
description = 'DESIGNLY generation credit costs; AI Music is 100 credits per started minute'
WHERE key = 'generation_costs';

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'generation_costs',
  '{"music":100}',
  'DESIGNLY AI Music: 100 credits per started minute'
)
ON CONFLICT (key) DO NOTHING;
