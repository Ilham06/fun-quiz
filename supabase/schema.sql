-- Fun Quiz App Schema
-- Run this in your Supabase SQL editor

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  code text not null unique,
  type text not null default 'quiz' check (type in ('quiz', 'exam', 'feedback', 'qa')),
  theme text not null default 'default',
  is_active boolean not null default false,
  shuffle_questions boolean not null default false,
  shuffle_options boolean not null default false,
  created_at timestamptz not null default now()
);

-- Questions table
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  text text not null,
  type text not null default 'open' check (type in ('open', 'multiple_choice')),
  options jsonb,
  correct_answer text,
  timer_seconds integer default 0,
  "order" integer not null default 0,
  is_active boolean not null default false,
  show_answers boolean not null default true,
  created_at timestamptz not null default now()
);

-- Answers table
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  student_name text,
  content text not null,
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);

-- Reactions table (emoji reactions)
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  emoji text not null default '👍',
  created_at timestamptz not null default now()
);

-- Tab violations table (anti-cheat: detects tab switching during exams)
create table if not exists tab_violations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  student_name text,
  left_at timestamptz not null,
  returned_at timestamptz,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_questions_session_id on questions(session_id);
create index if not exists idx_answers_session_id on answers(session_id);
create index if not exists idx_answers_question_id on answers(question_id);
create index if not exists idx_sessions_code on sessions(code);
create index if not exists idx_reactions_session_id on reactions(session_id);
create index if not exists idx_tab_violations_session_id on tab_violations(session_id);

-- Enable Row Level Security (RLS)
alter table sessions enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table reactions enable row level security;
alter table tab_violations enable row level security;

-- RLS Policies
create policy "Anyone can read active sessions" on sessions
  for select using (is_active = true);

create policy "Anyone can read questions" on questions
  for select using (true);

create policy "Anyone can insert answers" on answers
  for insert with check (true);

create policy "Anyone can read answers" on answers
  for select using (true);

create policy "Anyone can update answer upvotes" on answers
  for update using (true) with check (true);

create policy "Anyone can insert reactions" on reactions
  for insert with check (true);

create policy "Anyone can read reactions" on reactions
  for select using (true);

create policy "Anyone can insert tab_violations" on tab_violations
  for insert with check (true);

create policy "Anyone can read tab_violations" on tab_violations
  for select using (true);

create policy "Anyone can update tab_violations" on tab_violations
  for update using (true) with check (true);

-- Enable Realtime
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table reactions;
