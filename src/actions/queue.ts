"use server";

import { createAdminSupabase } from "@/lib/supabase/server";

export async function serverCallNext(entryId: string, servingId: string | null) {
  const supabase = await createAdminSupabase();
  await (supabase.from("queue_entries") as any).update({ status: "serving", called_at: new Date().toISOString() }).eq("id", entryId);
  if (servingId) {
    await (supabase.from("queue_entries") as any).update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", servingId);
  }
}

export async function serverComplete(entryId: string) {
  const supabase = await createAdminSupabase();
  await (supabase.from("queue_entries") as any).update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", entryId);
}

export async function serverNoShow(entryId: string) {
  const supabase = await createAdminSupabase();
  await (supabase.from("queue_entries") as any).update({ status: "no_show" }).eq("id", entryId);
}

export async function serverDeleteEntry(entryId: string) {
  const supabase = await createAdminSupabase();
  const { error } = await (supabase.from("queue_entries") as any).delete().eq("id", entryId);
  return { error: error?.message ?? null };
}

export async function serverAddCustomer(shopId: string, name: string, phone: string, serviceIds: string[] = []) {
  const supabase = await createAdminSupabase();
  const { data: last } = await (supabase.from("queue_entries") as any)
    .select("ticket_number")
    .eq("shop_id", shopId)
    .order("ticket_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const next = ((last as any)?.ticket_number || 0) + 1;

  const { error } = await (supabase.from("queue_entries") as any).insert({
    shop_id: shopId,
    service_id: serviceIds[0] || undefined,
    service_ids: serviceIds.length > 0 ? serviceIds.join(",") : undefined,
    ticket_number: next,
    customer_name: name.trim(),
    customer_phone: phone.replace(/\D/g, ""),
    status: "waiting",
  });
  return { error: error?.message ?? null };
}
