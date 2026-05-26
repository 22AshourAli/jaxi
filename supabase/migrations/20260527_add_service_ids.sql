-- Add service_ids column for multi-service selection
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS service_ids TEXT DEFAULT '';

-- Update existing entries: copy service_id into service_ids
UPDATE queue_entries SET service_ids = service_id WHERE service_ids = '' AND service_id IS NOT NULL;
