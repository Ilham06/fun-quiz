-- Migration: add new columns and tables for v2 features
-- Run this if you already ran the original schema.sql

-- Add 'exam' to sessions type check constraint
alter table sessions drop constraint if exists sessions_type_check;
alter table sessions add constraint sessions_type_check check (type in ('quiz', 'exam', 'feedback', 'qa'));

-- Add new columns to sessions
alter table sessions add column if not exists theme text not null default 'default';

-- Add new columns to questions
alter table questions add column if not exists timer_seconds integer default 0;
alter table questions add column if not exists show_answers boolean not null default true;

-- Add upvotes column to answers
alter table answers add column if not exists upvotes integer not null default 0;

-- Create reactions table
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  emoji text not null default '👍',
  created_at timestamptz not null default now()
);

create index if not exists idx_reactions_session_id on reactions(session_id);

-- RLS for reactions
alter table reactions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'reactions' and policyname = 'Anyone can insert reactions') then
    create policy "Anyone can insert reactions" on reactions for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reactions' and policyname = 'Anyone can read reactions') then
    create policy "Anyone can read reactions" on reactions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'answers' and policyname = 'Anyone can update answer upvotes') then
    create policy "Anyone can update answer upvotes" on answers for update using (true) with check (true);
  end if;
end $$;

-- Tab violations table (anti-cheat)
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

create index if not exists idx_tab_violations_session_id on tab_violations(session_id);

alter table tab_violations enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'tab_violations' and policyname = 'Anyone can insert tab_violations') then
    create policy "Anyone can insert tab_violations" on tab_violations for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'tab_violations' and policyname = 'Anyone can read tab_violations') then
    create policy "Anyone can read tab_violations" on tab_violations for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'tab_violations' and policyname = 'Anyone can update tab_violations') then
    create policy "Anyone can update tab_violations" on tab_violations for update using (true) with check (true);
  end if;
end $$;

-- Enable Realtime for reactions (skip if already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table reactions;
  end if;
end $$;
