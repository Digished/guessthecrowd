"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessionId } from "@/lib/session";

export default function Leaderboard() {
  const [day, setDay] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const sid = useMemo(() => getSessionId(), []);

  useEffect(() => {
    fetch(`/api/today?sid=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((d) => {
        setDay(d.day);
        if (d.day) {
          fetch(`/api/results?sid=${encodeURIComponent(sid)}&day=${d.day.id}`)
            .then((r) => r.json())
            .then(setResults);
        }
      });
  }, [sid]);

  if (!day) return <div className="pt-20 text-center text-ink/60">No game today.</div>;
  if (!results) return <div className="pt-20 text-center text-ink/60">Loading…</div>;

  return (
    <div className="animate-fade-up">
      <div className="text-xs uppercase tracking-widest text-ink/50">Day #{day.day_number}</div>
      <h1 className="text-3xl font-black">Leaderboard</h1>
      <div className="card p-5 mt-5">
        <ol className="space-y-1.5">
          {results.leaderboard.map((row: any, i: number) => (
            <li key={row.submissionId} className="flex items-center gap-3 text-sm py-1 px-2">
              <span className="w-6 text-ink/50">{i + 1}.</span>
              <span className="flex-1 truncate">{row.username}</span>
              <span className="tabular-nums">{Math.round(row.score)}</span>
            </li>
          ))}
        </ol>
      </div>
      <a href="/" className="btn-ghost w-full mt-5">Back to game</a>
    </div>
  );
}
