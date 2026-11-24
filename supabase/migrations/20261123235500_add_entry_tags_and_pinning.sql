alter table public.journal_entries
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists is_pinned boolean not null default false;

alter table public.journal_entries
  drop constraint if exists journal_entries_tags_check;

alter table public.journal_entries
  add constraint journal_entries_tags_check
  check (
    cardinality(tags) <= 5
    and array_position(tags, '') is null
    and array_position(tags, null::text) is null
  );

create index if not exists journal_entries_user_pinned_created_at_idx
  on public.journal_entries (user_id, is_pinned desc, created_at desc);

notify pgrst, 'reload schema';
