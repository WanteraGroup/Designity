-- Align seeded credit packages with the current public credit pricing.
-- Custom packages are handled server-side as custom_<credits>.
INSERT INTO credit_packages (id, credits, price, label, sort_order) VALUES
  ('pkg_100', 100, 2000, '100 credits', 1),
  ('pkg_500', 500, 9500, '500 credits', 2),
  ('pkg_1000', 1000, 11000, '1,000 credits', 3),
  ('pkg_2500', 2500, 25000, '2,500 credits', 4),
  ('pkg_5000', 5000, 50000, '5,000 credits', 5),
  ('pkg_10000', 10000, 100000, '10,000 credits', 6)
ON CONFLICT (id) DO UPDATE SET
  credits = EXCLUDED.credits,
  price = EXCLUDED.price,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;
