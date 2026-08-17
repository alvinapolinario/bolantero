insert into public.service_areas (code, name, center_lat, center_lng, radius_km) values
  ('tacurong', 'Tacurong City', 6.6925, 124.8472, 12),
  ('lambayong', 'Lambayong', 6.7889, 124.6333, 12),
  ('isulan', 'Isulan', 6.6294, 124.6050, 12)
on conflict (code) do nothing;

insert into public.categories (slug, name, phase) values
  ('restaurant', 'Restaurant', 1),
  ('bakery', 'Bakery', 1),
  ('coffee', 'Coffee Shops', 1),
  ('fast-food', 'Fast Food', 1)
on conflict (slug) do nothing;

insert into public.delivery_fee_rules (
  name, service_area_code, base_fee, free_km, per_km_fee,
  express_multiplier, scheduled_surcharge, cod_handling_fee, is_active
) values
  ('Default SK', null, 49, 2, 10, 1.5, 15, 10, true),
  ('Tacurong', 'tacurong', 45, 2, 9, 1.5, 12, 10, true);

insert into public.trip_fare_rules (
  name, service_type, service_area_code, base_fee, free_km, per_km_fee,
  small_surcharge, medium_surcharge, large_surcharge, platform_fee_bps, is_active
) values
  ('Default Ride', 'ride', null, 40, 1, 12, 0, 0, 0, 2000, true),
  ('Default Padala', 'courier', null, 49, 1, 15, 0, 15, 30, 2000, true);

-- Auth users, merchants, and products are created by:
--   pnpm seed
-- (scripts/seed-demo.mjs)
