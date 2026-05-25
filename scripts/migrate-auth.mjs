const SUPABASE_URL = "https://joekmmruyuiwzkdpmnor.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shops = [
  { id: "00000000-0000-0000-0000-000000000001", name: "صالون الحلاقة العصري", email: "shop1@dawrk.app", password: "Shop123!" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Barber Studio", email: "shop2@dawrk.app", password: "Shop123!" },
];

async function createUser(shop) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: shop.email,
      password: shop.password,
      email_confirm: true,
      user_metadata: { shop_id: shop.id, shop_name: shop.name },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to create ${shop.email}: ${JSON.stringify(data)}`);
  console.log(`✓ Created user: ${shop.email} (${data.id}) → shop: "${shop.name}"`);
  return data;
}

async function main() {
  console.log("Creating auth users for seeded shops...\n");
  for (const shop of shops) {
    try {
      await createUser(shop);
    } catch (err) {
      console.error(err.message);
    }
  }
  console.log("\nDone! Login credentials:");
  shops.forEach((s) => console.log(`  ${s.email} / ${s.password} → ${s.name}`));
}

main().catch(console.error);
