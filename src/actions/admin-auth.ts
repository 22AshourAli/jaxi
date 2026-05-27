"use server";

import { cookies } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/server";

const DEFAULT_PASSWORD = (process.env.ADMIN_PASSWORD || "admin123").trim();
const SHOP_ID = "718db02b-02cf-4754-bafa-b7dedb841e9b";

export async function adminLogin(password: string) {
  const trimmed = password.trim();

  // Check working_hours.admin_password from DB first
  const supabase = await createAdminSupabase();
  const { data: shop } = await (supabase.from("shops") as any)
    .select("working_hours")
    .eq("id", SHOP_ID)
    .maybeSingle();

  const wh = (shop as any)?.working_hours || {};
  const dbPassword = wh?.admin_password;
  if (dbPassword && trimmed === dbPassword.trim()) {
    return setSession();
  }

  // Fallback to env var
  if (trimmed === DEFAULT_PASSWORD) {
    return setSession();
  }

  return { error: true };
}

async function setSession() {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return { success: true, error: false };
}

export async function serverChangePassword(currentPassword: string, newPassword: string) {
  const trimmed = currentPassword.trim();
  const newTrimmed = newPassword.trim();

  if (newTrimmed.length < 4) {
    return { error: "Password must be at least 4 characters", ar_error: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" };
  }

  const supabase = await createAdminSupabase();

  // Get current working_hours
  const { data: shop } = await (supabase.from("shops") as any)
    .select("working_hours")
    .eq("id", SHOP_ID)
    .maybeSingle();

  const wh = (shop as any)?.working_hours || {};
  const dbPassword = wh?.admin_password;

  // Verify current password
  if (dbPassword && trimmed !== dbPassword.trim()) {
    return { error: "Current password is incorrect", ar_error: "كلمة المرور الحالية غير صحيحة" };
  }
  if (!dbPassword && trimmed !== DEFAULT_PASSWORD) {
    return { error: "Current password is incorrect", ar_error: "كلمة المرور الحالية غير صحيحة" };
  }

  // Store new password in working_hours JSONB
  const updatedWh = { ...wh, admin_password: newTrimmed };
  const { error } = await (supabase.from("shops") as any)
    .update({ working_hours: updatedWh })
    .eq("id", SHOP_ID);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

export async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}
