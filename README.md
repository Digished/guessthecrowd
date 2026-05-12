# Guess the Crowd

A daily 5-question game where you try to predict what most people will say. Free-text answers, no logins, mobile-first.

## Stack
- Next.js (App Router) + Tailwind
- Supabase (Postgres + service role for writes)
- Deployable on Vercel

## Setup

1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL` + `ADMIN_PASSWORD` (gate `/admin`)
3. `npm install && npm run dev`

## Daily questions
Visit `/admin`, enter the admin password, pick a play date, and add 5 prompts. Questions for the day go live automatically when their `play_date` matches the server's date.

## How scoring works
Each answer is normalized (lowercase, trim, strip punctuation/articles) and grouped against either admin-provided canonical groups or auto-clustered with Damerau-Levenshtein fuzzy matching. A question's score is the percentage of players in your canonical bucket.

## Routes
- `/` – game (one question at a time, locks on submit, shows results)
- `/leaderboard` – top 20 for today
- `/admin` – create the next day's questions

## Notes
This MVP reveals results immediately after a player submits, using the current crowd state, to keep the engagement loop tight. To gate results until a fixed reveal time, check `days.reveal_at` in the results route before returning the distribution.
