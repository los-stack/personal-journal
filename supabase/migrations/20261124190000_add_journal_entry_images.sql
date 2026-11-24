insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'journal-entry-images',
  'journal-entry-images',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create table if not exists public.journal_entry_images (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists journal_entry_images_user_entry_idx
  on public.journal_entry_images (user_id, entry_id, created_at);

alter table public.journal_entry_images enable row level security;
grant select, insert, delete on public.journal_entry_images to authenticated;

drop policy if exists "Users can view their own journal entry images"
  on public.journal_entry_images;
create policy "Users can view their own journal entry images"
  on public.journal_entry_images
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can add images to their own journal entries"
  on public.journal_entry_images;
create policy "Users can add images to their own journal entries"
  on public.journal_entry_images
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and storage_path like auth.uid()::text || '/' || entry_id::text || '/%'
    and exists (
      select 1
      from public.journal_entries
      where journal_entries.id = entry_id
        and journal_entries.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own journal entry images"
  on public.journal_entry_images;
create policy "Users can delete their own journal entry images"
  on public.journal_entry_images
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can view their own journal image files"
  on storage.objects;
create policy "Users can view their own journal image files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'journal-entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.journal_entries
      where journal_entries.id::text = (storage.foldername(name))[2]
        and journal_entries.user_id = auth.uid()
    )
  );

drop policy if exists "Users can upload their own journal image files"
  on storage.objects;
create policy "Users can upload their own journal image files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'journal-entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.journal_entries
      where journal_entries.id::text = (storage.foldername(name))[2]
        and journal_entries.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own journal image files"
  on storage.objects;
create policy "Users can delete their own journal image files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'journal-entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.enforce_journal_entry_image_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  image_count integer;
begin
  perform 1
  from public.journal_entries
  where id = new.entry_id
    and user_id = new.user_id
  for update;

  if not found then
    raise exception 'Journal entry not found or not owned by user';
  end if;

  select count(*)
    into image_count
  from public.journal_entry_images
  where entry_id = new.entry_id;

  if image_count >= 3 then
    raise exception 'A journal entry can have no more than 3 images';
  end if;

  return new;
end;
$$;

drop trigger if exists journal_entry_images_limit_before_insert
  on public.journal_entry_images;
create trigger journal_entry_images_limit_before_insert
  before insert on public.journal_entry_images
  for each row execute function public.enforce_journal_entry_image_limit();

notify pgrst, 'reload schema';
