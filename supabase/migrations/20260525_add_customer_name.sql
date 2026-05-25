-- Add customer_name column to queue_entries
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Update shop name
UPDATE shops SET name = 'الحلاق الأنيق' WHERE id = '00000000-0000-0000-0000-000000000001';
