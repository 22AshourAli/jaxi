-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  avg_service_time INT NOT NULL DEFAULT 20,
  working_hours JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_services_shop_id ON services(shop_id);

-- Queue entries table
CREATE TYPE queue_status AS ENUM ('waiting', 'serving', 'completed', 'cancelled', 'no_show');

CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  ticket_number INT NOT NULL,
  customer_phone TEXT,
  status queue_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_queue_entries_shop_id ON queue_entries(shop_id);
CREATE INDEX idx_queue_entries_status ON queue_entries(status);
CREATE INDEX idx_queue_entries_created_at ON queue_entries(created_at);

-- Push subscription table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view shops" ON shops FOR SELECT USING (TRUE);
CREATE POLICY "Shop owners can update their shop" ON shops FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (TRUE);
CREATE POLICY "Shop owners can manage services" ON services FOR ALL USING (auth.uid()::text = shop_id::text);

CREATE POLICY "Anyone can create queue entries" ON queue_entries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can view queue entries" ON queue_entries FOR SELECT USING (TRUE);
CREATE POLICY "Shop owners can update queue entries" ON queue_entries FOR UPDATE USING (auth.uid()::text = shop_id::text);

CREATE POLICY "Anyone can subscribe" ON subscriptions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Shop owners can manage subscriptions" ON subscriptions FOR ALL USING (auth.uid()::text = shop_id::text);

-- Enable Realtime for queue_entries
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE shops;
