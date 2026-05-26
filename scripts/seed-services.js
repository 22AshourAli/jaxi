const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  await s.from('services').delete().eq('name', 'test');

  const services = [
    ['حلاقة شعر', 30, 1],
    ['حلاقة دقن', 15, 2],
    ['حلاقة شعر + دقن', 40, 3],
    ['استشوار ومكواة', 20, 4],
    ['صبغ شعر', 60, 5],
    ['غسيل وجه', 15, 6],
    ['عناية كاملة (شعر + دقن + غسيل)', 50, 7],
  ];

  const shopId = '718db02b-02cf-4754-bafa-b7dedb841e9b';

  for (const [name, duration, sort] of services) {
    const { error } = await s.from('services').insert({
      shop_id: shopId,
      name,
      duration_minutes: duration,
      sort_order: sort,
    });
    if (error) {
      console.error('ERR:', name, error.message);
    } else {
      console.log('OK:', name);
    }
  }
  console.log('DONE');
}

main().catch(console.error);
