import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { groupAnswers } from "@/lib/scoring";
import type { CanonicalGroup } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sid") ?? "";
  const dayId = url.searchParams.get("day") ?? "";
  if (!dayId) return NextResponse.json({ error: "day required" }, { status: 400 });

  const sb = supabaseAdmin();

  const { data: day } = await sb
    .from("days")
    .select("id, day_number, play_date, reveal_at")
    .eq("id", dayId)
    .single();
  if (!day) return NextResponse.json({ error: "day not found" }, { status: 404 });

  const { data: questions } = await sb
    .from("questions")
    .select("id, position, prompt, canonical_groups")
    .eq("day_id", dayId)
    .order("position");

  const { data: subs } = await sb
    .from("submissions")
    .select("id, session_id, username, score, created_at")
    .eq("day_id", dayId);

  const subIds = (subs ?? []).map((s) => s.id);
  const { data: allAnswers } = subIds.length
    ? await sb
        .from("answers")
        .select("id, submission_id, question_id, raw, normalized, canonical")
        .in("submission_id", subIds)
    : { data: [] as any[] };

  // Group answers per question.
  const perQuestion: Record<
    string,
    {
      prompt: string;
      position: number;
      distribution: { key: string; count: number; percentage: number }[];
      answersById: Record<string, { canonical: string; raw: string; percentage: number }>;
    }
  > = {};

  const totalSubs = (subs ?? []).length;
  const perSubmissionScore = new Map<string, number>();

  for (const q of questions ?? []) {
    const rows = (allAnswers ?? []).filter((a) => a.question_id === q.id);
    const groups = (q.canonical_groups ?? []) as CanonicalGroup[];
    const { canonicalByIndex, distribution } = groupAnswers(
      rows.map((r) => ({ raw: r.raw, normalized: r.normalized, canonical: r.canonical })),
      groups,
    );
    const pctByKey = new Map(distribution.map((d) => [d.key, d.percentage]));
    const answersById: Record<string, { canonical: string; raw: string; percentage: number }> = {};
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const canon = canonicalByIndex[i];
      const pct = pctByKey.get(canon) ?? 0;
      answersById[r.submission_id] = { canonical: canon, raw: r.raw, percentage: pct };
      perSubmissionScore.set(r.submission_id, (perSubmissionScore.get(r.submission_id) ?? 0) + pct);
    }
    perQuestion[q.id] = { prompt: q.prompt, position: q.position, distribution, answersById };
  }

  // Leaderboard (top 20, with usernames).
  const leaderboard = (subs ?? [])
    .map((s) => ({
      submissionId: s.id,
      username: s.username ?? "anon",
      score: perSubmissionScore.get(s.id) ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // Your result if sessionId provided.
  let mine: any = null;
  if (sessionId) {
    const sub = (subs ?? []).find((s) => s.session_id === sessionId);
    if (sub) {
      const score = perSubmissionScore.get(sub.id) ?? 0;
      const ranked = (subs ?? [])
        .map((s) => perSubmissionScore.get(s.id) ?? 0)
        .sort((a, b) => b - a);
      const rank = ranked.findIndex((s) => s <= score) + 1;
      const percentile =
        totalSubs > 1 ? Math.round(((totalSubs - rank + 1) / totalSubs) * 100) : 100;
      const perQ = (questions ?? []).map((q) => {
        const a = perQuestion[q.id].answersById[sub.id];
        return {
          questionId: q.id,
          position: q.position,
          prompt: q.prompt,
          yourAnswer: a?.raw ?? "",
          yourCanonical: a?.canonical ?? "other",
          yourPercentage: a?.percentage ?? 0,
          distribution: perQuestion[q.id].distribution,
        };
      });
      mine = { submissionId: sub.id, username: sub.username, score, rank, percentile, perQuestion: perQ };
    }
  }

  return NextResponse.json({
    day,
    totalSubmissions: totalSubs,
    leaderboard,
    mine,
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      position: q.position,
      distribution: perQuestion[q.id].distribution,
    })),
  });
}
