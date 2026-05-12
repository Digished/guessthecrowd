import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function checkAuth(req: Request) {
  const auth = req.headers.get("x-admin-password") ?? "";
  return auth && auth === process.env.ADMIN_PASSWORD;
}

export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const { play_date, prompts, canonical_groups } = body as {
    play_date: string;
    prompts: string[];
    canonical_groups?: any[][];
  };
  if (!play_date || !Array.isArray(prompts) || prompts.length !== 5) {
    return NextResponse.json({ error: "need play_date and 5 prompts" }, { status: 400 });
  }
  const sb = supabaseAdmin();

  const { data: existing } = await sb.from("days").select("id").eq("play_date", play_date).maybeSingle();
  if (existing) return NextResponse.json({ error: "day already exists" }, { status: 409 });

  const { data: maxDay } = await sb
    .from("days")
    .select("day_number")
    .order("day_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const next = (maxDay?.day_number ?? 0) + 1;

  const { data: day, error: dayErr } = await sb
    .from("days")
    .insert({ play_date, day_number: next })
    .select("id, day_number")
    .single();
  if (dayErr || !day) return NextResponse.json({ error: dayErr?.message }, { status: 500 });

  const rows = prompts.map((p, i) => ({
    day_id: day.id,
    position: i + 1,
    prompt: p,
    canonical_groups: canonical_groups?.[i] ?? [],
  }));
  const { error: qErr } = await sb.from("questions").insert(rows);
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, day });
}

export async function GET(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseAdmin();
  const { data: days } = await sb
    .from("days")
    .select("id, day_number, play_date, reveal_at")
    .order("play_date", { ascending: false })
    .limit(30);
  return NextResponse.json({ days: days ?? [] });
}
