-- Cloud sync for DearDiary.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) once per project. The app
-- works without it: sync is off unless VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
--
-- Email sign-in sends a SIX-DIGIT code, not a link. Supabase only includes that code when the
-- email template contains the token placeholder, so before the first sign-in add `{{ .Token }}`
-- to BOTH templates under Authentication > Email Templates:
--   - Confirm signup  (a brand-new address; signInWithOtp also signs the user up)
--   - Magic Link      (an address that already has an account)
-- Without it the mail carries only a link and the code field can never be filled. For local
-- development `supabase/config.toml` already points both templates at `supabase/templates/`.

-- One row per entry per account. Imported entries can have legacy string ids, so `id` is text;
-- owner_id in the composite key prevents a matching id under another account from colliding.
create table if not exists public.entries (
  id          text not null,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null default '',
  content     text not null default '',
  mood        text not null default 'calm',
  tags        text[] not null default '{}',
  entry_date  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  -- The logical stamp the merge compares. Kept as timestamptz so a stale write is a plain
  -- comparison in SQL, not a string compare the client and the database could disagree on.
  updated_at  timestamptz not null default now(),
  is_favorite boolean not null default false,
  is_private  boolean not null default false,
  location    text,
  images      text[],
  word_count  integer not null default 0,
  reading_time integer not null default 0,
  -- Tombstone. A deleted entry keeps its row with this stamp so the deletion reaches the
  -- other device; a row that vanished instead would simply be re-downloaded.
  deleted_at  timestamptz,
  primary key (owner_id, id)
);

-- Reads are always "my rows, newest first"; this serves both the pull and the RLS filter.
create index if not exists entries_owner_updated_idx
  on public.entries (owner_id, updated_at desc);

-- Row-level security: every statement is scoped to the caller, so the adapter never filters
-- by owner itself and a missing `where` cannot leak another account's diary.
alter table public.entries enable row level security;

drop policy if exists entries_select_own on public.entries;
create policy entries_select_own on public.entries
  for select using (auth.uid() = owner_id);

drop policy if exists entries_insert_own on public.entries;
create policy entries_insert_own on public.entries
  for insert with check (auth.uid() = owner_id);

drop policy if exists entries_update_own on public.entries;
create policy entries_update_own on public.entries
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists entries_delete_own on public.entries;
create policy entries_delete_own on public.entries
  for delete using (auth.uid() = owner_id);

-- Atomic upsert used by the client push. `on conflict ... where` is the whole point: a row
-- is only overwritten when the incoming `updated_at` is strictly newer, so two devices
-- pushing at the same time cannot let the older write win.
--
-- The function returns the ids it actually accepted, so a rejected row is reported rather
-- than silently dropped: the client keeps a rejected id queued and retries it, instead of
-- clearing a change the server never took. A tie is not a silent rejection — the client's
-- merge re-stamps a locally-won tie strictly past the shared stamp before pushing, so the
-- winner carries a newer stamp and lands here.
--
-- SECURITY INVOKER (the default): RLS still applies, so a caller can neither read nor write
-- a row owned by someone else, and the update of a foreign row silently affects nothing.
create or replace function public.upsert_entries(p_rows jsonb)
returns setof text
language sql
security invoker
set search_path = public
as $$
  insert into public.entries (
    id, owner_id, title, content, mood, tags, entry_date, created_at, updated_at,
    is_favorite, is_private, location, images, word_count, reading_time, deleted_at
  )
  select
    r.id, r.owner_id, r.title, r.content, r.mood, r.tags, r.entry_date, r.created_at, r.updated_at,
    r.is_favorite, r.is_private, r.location, r.images, r.word_count, r.reading_time, r.deleted_at
  from jsonb_to_recordset(p_rows) as r (
    id text, owner_id uuid, title text, content text, mood text, tags text[],
    entry_date timestamptz, created_at timestamptz, updated_at timestamptz,
    is_favorite boolean, is_private boolean, location text, images text[],
    word_count integer, reading_time integer, deleted_at timestamptz
  )
  where r.owner_id = auth.uid()
  on conflict (owner_id, id) do update set
    title        = excluded.title,
    content      = excluded.content,
    mood         = excluded.mood,
    tags         = excluded.tags,
    entry_date   = excluded.entry_date,
    updated_at   = excluded.updated_at,
    is_favorite  = excluded.is_favorite,
    is_private   = excluded.is_private,
    location     = excluded.location,
    images       = excluded.images,
    word_count   = excluded.word_count,
    reading_time = excluded.reading_time,
    deleted_at   = excluded.deleted_at
  -- Reject the stale write: only a strictly newer stamp overwrites. This is the atomic
  -- guard that a simultaneous push from another device cannot beat.
  where public.entries.updated_at < excluded.updated_at
  -- The ids that were inserted or updated; a rejected conflict returns no row.
  returning id;
$$;

revoke all on function public.upsert_entries(jsonb) from public, anon;
grant execute on function public.upsert_entries(jsonb) to authenticated;
