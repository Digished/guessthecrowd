import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sid") ?? "";
  const sb = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: day } = await sb
    .from("days")
    .select("id, day_number, play_date, reveal_at")
    .eq("play_date", today)
    .maybeSingle();

  if (!day) return NextResponse.json({ day: null, questions: [], submission: null });

  const { data: questions } = await sb
    .from("questions")
    .select("id, position, prompt")
    .eq("day_id", day.id)
    .order("position", { ascending: true });

  let submission: any = null;
  if (sessionId) {
    const { data: sub } = await sb
      .from("submissions")
      .select("id, score, username, created_at")
      .eq("session_id", sessionId)
      .eq("day_id", day.id)
      .maybeSingle();
    submission = sub;
  }

  return NextResponse.json({ day, questions: questions ?? [], submission });
}
