create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  content text not null check (char_length(btrim(content)) > 0),
  mood text check (
    mood is null or mood in ('happy', 'neutral', 'sad', 'excited', 'calm', 'anxious')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_created_at_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;

grant select, insert, update, delete on public.journal_entries to authenticated;

drop policy if exists "Users can view their own journal entries"
  on public.journal_entries;
create policy "Users can view their own journal entries"
  on public.journal_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own journal entries"
  on public.journal_entries;
create policy "Users can create their own journal entries"
  on public.journal_entries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own journal entries"
  on public.journal_entries;
create policy "Users can update their own journal entries"
  on public.journal_entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own journal entries"
  on public.journal_entries;
create policy "Users can delete their own journal entries"
  on public.journal_entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
