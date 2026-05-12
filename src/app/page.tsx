"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessionId, getUsername, setUsername as saveUsername } from "@/lib/session";

type Q = { id: string; position: number; prompt: string };
type Day = { id: string; day_number: number; play_date: string };

export default function Home() {
  const [day, setDay] = useState<Day | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [usernamePrompt, setUsernamePrompt] = useState(false);
  const [username, setUsername] = useState("");
  const [results, setResults] = useState<any>(null);
  const sid = useMemo(() => getSessionId(), []);

  useEffect(() => {
    if (!sid) return;
    fetch(`/api/today?sid=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((d) => {
        setDay(d.day);
        setQuestions(d.questions);
        setSubmission(d.submission);
        setAnswers(new Array(d.questions.length).fill(""));
        if (d.submission) {
          setDone(true);
          loadResults(d.day.id);
        }
        setLoaded(true);
      });
  }, [sid]);

  async function loadResults(dayId: string) {
    const r = await fetch(`/api/results?sid=${encodeURIComponent(sid)}&day=${dayId}`).then((r) => r.json());
    setResults(r);
  }

  function next() {
    if (!answers[step]?.trim()) return;
    if (step < questions.length - 1) setStep(step + 1);
    else submit();
  }

  async function submit() {
    if (!day) return;
    setSubmitting(true);
    const payload = {
      sessionId: sid,
      dayId: day.id,
      username: getUsername() ?? undefined,
      answers: questions.map((q, i) => ({ questionId: q.id, raw: answers[i] })),
    };
    const r = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (r.ok) {
      setDone(true);
      if (!getUsername()) setUsernamePrompt(true);
      loadResults(day.id);
    }
  }

  async function saveName() {
    if (!username.trim() || !day) return;
    saveUsername(username.trim());
    await fetch("/api/username", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sid, dayId: day.id, username: username.trim() }),
    });
    setUsernamePrompt(false);
    loadResults(day.id);
  }

  if (!loaded) {
    return <div className="pt-20 text-center text-ink/60">Loading…</div>;
  }

  if (!day || questions.length === 0) {
    return (
      <div className="pt-16 text-center animate-fade-up">
        <h1 className="text-4xl font-black tracking-tight">Guess the Crowd</h1>
        <p className="mt-2 text-ink/70">No game today. Come back tomorrow!</p>
      </div>
    );
  }

  if (done) {
    return (
      <Results
        results={results}
        day={day}
        usernamePrompt={usernamePrompt}
        username={username}
        setUsername={setUsername}
        saveName={saveName}
      />
    );
  }

  const q = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-up">
      <header className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/50">Day #{day.day_number}</div>
          <h1 className="text-2xl font-black">Guess the Crowd</h1>
        </div>
        <div className="text-sm font-semibold text-ink/60">
          {step + 1}/{questions.length}
        </div>
      </header>

      <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden mb-6">
        <div
          className="h-full bg-ink transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card p-6 animate-pop-in" key={q.id}>
        <div className="text-xs uppercase tracking-widest text-pop font-bold">
          What will most people say?
        </div>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{q.prompt}</h2>
        <input
          autoFocus
          className="input mt-6"
          placeholder="Type your guess…"
          value={answers[step]}
          onChange={(e) => {
            const v = e.target.value;
            setAnswers((a) => a.map((x, i) => (i === step ? v : x)));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") next();
          }}
          maxLength={60}
        />
        <button
          className="btn-primary w-full mt-5"
          disabled={!answers[step]?.trim() || submitting}
          onClick={next}
        >
          {step < questions.length - 1 ? "Next" : submitting ? "Locking in…" : "Lock it in"}
        </button>
        <p className="mt-3 text-center text-xs text-ink/50">
          Answers lock after submission. No edits.
        </p>
      </div>
    </div>
  );
}

function Results({
  results,
  day,
  usernamePrompt,
  username,
  setUsername,
  saveName,
}: any) {
  if (!results) return <div className="pt-20 text-center text-ink/60">Tallying the crowd…</div>;
  const mine = results.mine;
  return (
    <div className="animate-fade-up">
      <header className="text-center mb-6">
        <div className="text-xs uppercase tracking-widest text-ink/50">Day #{day.day_number}</div>
        <h1 className="text-3xl font-black">Locked in 🔒</h1>
      </header>

      {mine && (
        <div className="card p-6 mb-5 text-center">
          <div className="text-sm text-ink/60">Your score</div>
          <div className="text-6xl font-black mt-1">{Math.round(mine.score)}</div>
          <div className="mt-2 text-sm text-ink/70">
            Top {100 - mine.percentile + 1}% of {results.totalSubmissions} players
          </div>
          <ShareButton
            score={Math.round(mine.score)}
            percentile={mine.percentile}
            dayNumber={day.day_number}
          />
        </div>
      )}

      {usernamePrompt && (
        <div className="card p-5 mb-5">
          <div className="font-bold">Want a name on the leaderboard?</div>
          <div className="flex gap-2 mt-3">
            <input
              className="input flex-1"
              placeholder="Pick a username"
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className="btn-primary" onClick={saveName}>
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {mine?.perQuestion?.map((q: any) => (
          <div key={q.questionId} className="card p-5">
            <div className="text-xs uppercase tracking-widest text-ink/40">
              Q{q.position}
            </div>
            <div className="font-bold mt-1">{q.prompt}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-sm text-ink/60">You said</div>
              <div className="font-bold">{q.yourAnswer || <em>nothing</em>}</div>
              <div className="ml-auto text-lg font-black text-pop">+{q.yourPercentage}</div>
            </div>
            <div className="mt-3 space-y-1.5">
              {q.distribution.slice(0, 5).map((d: any) => (
                <div key={d.key} className="flex items-center gap-2 text-sm">
                  <div className="w-24 truncate">{d.key}</div>
                  <div className="flex-1 h-2 bg-ink/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        d.key === q.yourCanonical ? "bg-pop" : "bg-ink/60"
                      }`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <div className="w-10 text-right tabular-nums">{d.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-5">
        <div className="font-bold mb-2">Leaderboard</div>
        <ol className="space-y-1.5">
          {results.leaderboard.map((row: any, i: number) => (
            <li
              key={row.submissionId}
              className={`flex items-center gap-3 text-sm py-1 px-2 rounded-lg ${
                mine && row.submissionId === mine.submissionId ? "bg-sun/40 font-bold" : ""
              }`}
            >
              <span className="w-6 text-ink/50">{i + 1}.</span>
              <span className="flex-1 truncate">{row.username}</span>
              <span className="tabular-nums">{Math.round(row.score)}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-6 text-center text-xs text-ink/50">
        Come back tomorrow for 5 new questions.
      </p>
    </div>
  );
}

function ShareButton({
  score,
  percentile,
  dayNumber,
}: {
  score: number;
  percentile: number;
  dayNumber: number;
}) {
  const text = `Guess the Crowd · Day #${dayNumber}\nScore ${score} · Top ${100 - percentile + 1}%\nplay → ${typeof window !== "undefined" ? window.location.origin : ""}`;
  async function share() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }
  return (
    <button className="btn-primary mt-4 w-full" onClick={share}>
      Share result
    </button>
  );
}
