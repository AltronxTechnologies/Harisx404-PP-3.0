-- Community Wall / Guestbook: messages table
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) <= 200),
  patternindex integer not null default 0,
  rotation integer not null default 0,
  user_id uuid references auth.users (id) on delete set null,
  creator_name text not null default 'Anonymous',
  creator_avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Anyone can read wall notes.
create policy "Public read access"
  on public.messages for select
  using (true);

-- Only authenticated users can post, and only as themselves.
create policy "Authenticated users can insert their own notes"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users may delete their own notes (admin can manage via service role).
create policy "Users can delete their own notes"
  on public.messages for delete
  to authenticated
  using (auth.uid() = user_id);
