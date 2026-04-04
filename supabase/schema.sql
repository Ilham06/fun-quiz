-- Fun Quiz App Schema
-- Run this in your Supabase SQL editor

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  code text not null unique,
  type text not null default 'quiz' check (type in ('quiz', 'feedback', 'qa')),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Questions table
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  text text not null,
  type text not null default 'open' check (type in ('open', 'multiple_choice')),
  options jsonb,
  "order" integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Answers table
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  student_name text,
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_questions_session_id on questions(session_id);
create index if not exists idx_answers_session_id on answers(session_id);
create index if not exists idx_answers_question_id on answers(question_id);
create index if not exists idx_sessions_code on sessions(code);

-- Enable Row Level Security (RLS)
alter table sessions enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

-- RLS Policies: allow public read access (students can read sessions/questions)
create policy "Anyone can read active sessions" on sessions
  for select using (is_active = true);

create policy "Anyone can read questions" on questions
  for select using (true);

create policy "Anyone can insert answers" on answers
  for insert with check (true);

create policy "Anyone can read answers" on answers
  for select using (true);

-- Service role bypasses RLS (used server-side for teacher operations)

-- Enable Realtime for the answers table
-- Go to Supabase Dashboard > Database > Replication > Tables and enable for 'answers'
-- Or run:
alter publication supabase_realtime add table answers;
