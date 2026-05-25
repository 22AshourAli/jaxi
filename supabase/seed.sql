-- Single shop seed
INSERT INTO shops (id, name, phone, avg_service_time, working_hours)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'الحلاق الأنيق',
  '966500000001',
  20,
  '{"saturday":{"open":"09:00","close":"22:00"},"sunday":{"open":"09:00","close":"22:00"},"monday":{"open":"09:00","close":"22:00"},"tuesday":{"open":"09:00","close":"22:00"},"wednesday":{"open":"09:00","close":"22:00"},"thursday":{"open":"09:00","close":"23:00"},"friday":{"open":"14:00","close":"23:00"}}'
);

INSERT INTO services (shop_id, name, duration_minutes, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'قص شعر', 15, 1),
  ('00000000-0000-0000-0000-000000000001', 'قص + حلاقة', 25, 2),
  ('00000000-0000-0000-0000-000000000001', 'قص + حلاقة + غسيل', 35, 3),
  ('00000000-0000-0000-0000-000000000001', 'تلوين لحية', 20, 4);
