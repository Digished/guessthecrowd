import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sid") ?? "";
  const sb = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  // Use the most recent day with play_date <= today (UTC). This avoids
  // timezone-mismatch misses where admin schedules a date that doesn't
  // exactly equal the server's UTC date.
  const { data: day } = await sb
    .from("days")
    .select("id, day_number, play_date, reveal_at")
    .lte("play_date", today)
    .order("play_date", { ascending: false })
    .limit(1)
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
