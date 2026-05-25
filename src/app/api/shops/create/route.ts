import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { id, name }: Record<string, string> = await request.json();
    if (!id || !name) {
      return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    }

    const supabase = await createAdminSupabase();
    const { error } = await (supabase.from("shops") as any).insert({
      id,
      name,
      phone: "",
      working_hours: {},
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
