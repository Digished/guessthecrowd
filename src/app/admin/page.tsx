"use client";

import { useState } from "react";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [playDate, setPlayDate] = useState(new Date().toISOString().slice(0, 10));
  const [prompts, setPrompts] = useState<string[]>(["", "", "", "", ""]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-password": pw,
      },
      body: JSON.stringify({ play_date: playDate, prompts }),
    });
    const j = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Created day #${j.day.day_number}` : `Error: ${j.error}`);
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-black">Admin</h1>
      <p className="text-ink/60 text-sm">Create today's 5 questions.</p>

      <div className="card p-5 mt-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-ink/50">Password</label>
          <input
            type="password"
            className="input mt-1"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-ink/50">Play date</label>
          <input
            type="date"
            className="input mt-1"
            value={playDate}
            onChange={(e) => setPlayDate(e.target.value)}
          />
        </div>
        {prompts.map((p, i) => (
          <div key={i}>
            <label className="text-xs uppercase tracking-widest text-ink/50">
              Question {i + 1}
            </label>
            <input
              className="input mt-1"
              value={p}
              onChange={(e) =>
                setPrompts((arr) => arr.map((x, k) => (k === i ? e.target.value : x)))
              }
              placeholder={`e.g. Name a fruit that's red`}
            />
          </div>
        ))}
        <button className="btn-primary w-full" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Create day"}
        </button>
        {msg && <div className="text-sm text-center text-ink/70">{msg}</div>}
      </div>
    </div>
  );
}
