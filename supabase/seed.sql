-- Seed data for development
INSERT INTO shops (id, name, phone, avg_service_time, working_hours)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'صالون الحلاقة العصري', '966500000001', 20, '{"saturday":{"open":"09:00","close":"22:00"},"sunday":{"open":"09:00","close":"22:00"},"monday":{"open":"09:00","close":"22:00"},"tuesday":{"open":"09:00","close":"22:00"},"wednesday":{"open":"09:00","close":"22:00"},"thursday":{"open":"09:00","close":"23:00"},"friday":{"open":"14:00","close":"23:00"}}'),
  ('00000000-0000-0000-0000-000000000002', 'Barber Studio', '966500000002', 25, '{"saturday":{"open":"10:00","close":"21:00"},"sunday":{"open":"10:00","close":"21:00"},"monday":{"open":"10:00","close":"21:00"},"tuesday":{"open":"10:00","close":"21:00"},"wednesday":{"open":"10:00","close":"21:00"},"thursday":{"open":"10:00","close":"22:00"},"friday":{"open":"15:00","close":"22:00"}}');

INSERT INTO services (shop_id, name, duration_minutes, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'قص شعر', 15, 1),
  ('00000000-0000-0000-0000-000000000001', 'قص + حلاقة', 25, 2),
  ('00000000-0000-0000-0000-000000000001', 'قص + حلاقة + غسيل', 35, 3),
  ('00000000-0000-0000-0000-000000000001', 'تلوين لحية', 20, 4),
  ('00000000-0000-0000-0000-000000000002', 'Haircut', 15, 1),
  ('00000000-0000-0000-0000-000000000002', 'Haircut + Beard', 25, 2),
  ('00000000-0000-0000-0000-000000000002', 'Haircut + Beard + Wash', 35, 3),
  ('00000000-0000-0000-0000-000000000002', 'Beard Trim', 10, 4);
