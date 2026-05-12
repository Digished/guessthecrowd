import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { sessionId, dayId, username } = await req.json();
  if (!sessionId || !dayId || !username) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("submissions")
    .update({ username: String(username).slice(0, 24) })
    .eq("session_id", sessionId)
    .eq("day_id", dayId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
