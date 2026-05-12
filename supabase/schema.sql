-- Guess the Crowd schema
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  day_number int unique not null,
  play_date date unique not null,
  reveal_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  position int not null check (position between 1 and 5),
  prompt text not null,
  -- Optional canonical groups. JSON array of { key: string, aliases: string[] }
  -- If empty, auto-grouping by normalized text + fuzzy merge is used.
  canonical_groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (day_id, position)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  day_id uuid not null references days(id) on delete cascade,
  username text,
  score numeric not null default 0,
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, day_id)
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  raw text not null,
  normalized text not null,
  canonical text,
  score numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index if not exists answers_question_idx on answers(question_id);
create index if not exists submissions_day_idx on submissions(day_id);

-- Enable RLS but route all writes through service role on the server.
alter table days enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;

-- Public read for days/questions so the client can render via anon key if needed.
drop policy if exists "days readable" on days;
create policy "days readable" on days for select using (true);
drop policy if exists "questions readable" on questions;
create policy "questions readable" on questions for select using (true);
