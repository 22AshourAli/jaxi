const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Delete old combo services
  await s.from('services').delete().in('name', [
    'حلاقة شعر + دقن',
    'عناية كاملة (شعر + دقن + غسيل)',
  ]);

  const shopId = '718db02b-02cf-4754-bafa-b7dedb841e9b';

  // Individual services only - times reduced to ~1/3 of original
  const services = [
    ['حلاقة شعر', 15, 1],
    ['حلاقة دقن', 8, 2],
    ['استشوار ومكواة', 10, 3],
    ['صبغ شعر', 30, 4],
    ['غسيل وجه', 8, 5],
  ];

  for (const [name, duration, sort] of services) {
    const { data: existing } = await s.from('services').select('id').eq('shop_id', shopId).eq('name', name).maybeSingle();
    if (existing) {
      await s.from('services').update({ duration_minutes: duration, sort_order: sort }).eq('id', existing.id);
      console.log('UPDATED:', name, `(${duration}min)`);
    } else {
      await s.from('services').insert({ shop_id: shopId, name, duration_minutes: duration, sort_order: sort });
      console.log('INSERTED:', name, `(${duration}min)`);
    }
  }

  // Run migration: add service_ids column
  const { error: alterErr } = await s.rpc('exec_sql', {
    sql: `ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS service_ids TEXT DEFAULT '';`,
  });
  if (alterErr) {
    // Try direct SQL via REST
    console.log('Migration note:', alterErr.message);
    console.log('Run manually: ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS service_ids TEXT DEFAULT \'\';');
  } else {
    console.log('Migration: service_ids column ready');
  }

  console.log('DONE');
}

main().catch(console.error);
