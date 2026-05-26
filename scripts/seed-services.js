const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Delete old combos
  await s.from('services').delete().in('name', [
    'حلاقة شعر + دقن',
    'عناية كاملة (شعر + دقن + غسيل)',
  ]);

  const shopId = '718db02b-02cf-4754-bafa-b7dedb841e9b';

  // Upsert each service (insert or update by name+shop)
  const services = [
    ['حلاقة شعر', 15, 1, '✂️'],
    ['حلاقة دقن', 8, 2, '🪒'],
    ['استشوار ومكواة', 10, 3, '💨'],
    ['صبغ شعر', 30, 4, '🎨'],
    ['غسيل وجه', 8, 5, '🧼'],
  ];

  for (const [name, duration, sort, icon] of services) {
    // Check if exists
    const { data: existing } = await s.from('services').select('id').eq('shop_id', shopId).eq('name', name).maybeSingle();
    if (existing) {
      const { error } = await s.from('services').update({ duration_minutes: duration, sort_order: sort }).eq('id', existing.id);
      if (error) console.error('UPDATE ERR:', name, error.message);
      else console.log('UPDATED:', name, `(${duration}min)`);
    } else {
      const { error } = await s.from('services').insert({ shop_id: shopId, name, duration_minutes: duration, sort_order: sort });
      if (error) console.error('INSERT ERR:', name, error.message);
      else console.log('INSERTED:', name, `(${duration}min)`);
    }
  }

  console.log('DONE');
}

main().catch(console.error);
