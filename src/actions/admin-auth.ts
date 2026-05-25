"use server";

import { cookies } from "next/headers";

const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "admin123").trim();

export async function adminLogin(password: string) {
  if (password.trim() !== ADMIN_PASSWORD) {
    return { error: true };
  }
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
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
