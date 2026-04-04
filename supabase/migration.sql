-- Migration: add new columns and tables for v2 features
-- Run this if you already ran the original schema.sql

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

-- Enable Realtime for reactions (answers should already be enabled)
alter publication supabase_realtime add table reactions;
