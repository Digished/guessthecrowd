import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalize } from "@/lib/normalize";

export const dynamic = "force-dynamic";

type Body = {
  sessionId: string;
  dayId: string;
  username?: string;
  answers: { questionId: string; raw: string }[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body?.sessionId || !body?.dayId || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const sb = supabaseAdmin();

  const { data: existing } = await sb
    .from("submissions")
    .select("id")
    .eq("session_id", body.sessionId)
    .eq("day_id", body.dayId)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "already submitted" }, { status: 409 });

  const { data: sub, error: subErr } = await sb
    .from("submissions")
    .insert({
      session_id: body.sessionId,
      day_id: body.dayId,
      username: body.username?.slice(0, 24) || null,
      score: 0,
      locked: true,
    })
    .select("id")
    .single();
  if (subErr || !sub) return NextResponse.json({ error: subErr?.message ?? "insert failed" }, { status: 500 });

  const rows = body.answers.map((a) => ({
    submission_id: sub.id,
    question_id: a.questionId,
    raw: (a.raw ?? "").slice(0, 120),
    normalized: normalize(a.raw ?? ""),
    canonical: null as string | null,
    score: 0,
  }));
  const { error: ansErr } = await sb.from("answers").insert(rows);
  if (ansErr) return NextResponse.json({ error: ansErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, submissionId: sub.id });
}
