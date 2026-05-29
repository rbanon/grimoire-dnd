-- DnD Creator — Supabase PostgreSQL schema
-- Run this in the Supabase SQL editor after creating your project.

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Auto-create profile on user signup.
-- SECURITY DEFINER with fixed search_path prevents search_path injection.
-- EXECUTE is revoked from anon/authenticated — this is a trigger-only function.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Characters ────────────────────────────────────────────────────────────────
create table if not exists characters (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  level       smallint not null default 1 check (level between 1 and 20),
  class_name  text not null default '',
  race_name   text not null default '',
  portrait_url text,
  data        jsonb not null,  -- full Character JSON blob
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists characters_user_id_idx on characters(user_id);
create index if not exists characters_updated_at_idx on characters(updated_at desc);
-- GIN index for full-text search within JSONB (useful for future search features)
create index if not exists characters_data_gin on characters using gin(data);

-- ── Campaigns ─────────────────────────────────────────────────────────────────
create table if not exists campaigns (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  tags        text[] default '{}',
  linked_character_ids uuid[] default '{}',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists campaigns_user_id_idx on campaigns(user_id);

-- ── Campaign sessions ─────────────────────────────────────────────────────────
create table if not exists campaign_sessions (
  id             uuid primary key default uuid_generate_v4(),
  campaign_id    uuid references campaigns(id) on delete cascade not null,
  session_number smallint not null default 1,
  title          text,
  date           date,
  summary        text not null default '',
  tags           text[] default '{}',
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

create index if not exists campaign_sessions_campaign_id_idx on campaign_sessions(campaign_id);

-- ── NPCs ──────────────────────────────────────────────────────────────────────
create table if not exists npcs (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name        text not null,
  race        text,
  occupation  text,
  alignment   text,
  description text,
  notes       text,
  tags        text[] default '{}',
  is_alive    boolean not null default true,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists npcs_campaign_id_idx on npcs(campaign_id);

-- ── Campaign notes ────────────────────────────────────────────────────────────
create table if not exists campaign_notes (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  title       text not null default 'Untitled',
  body        text not null default '',
  tags        text[] default '{}',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists campaign_notes_campaign_id_idx on campaign_notes(campaign_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table characters enable row level security;
alter table campaigns enable row level security;
alter table campaign_sessions enable row level security;
alter table npcs enable row level security;
alter table campaign_notes enable row level security;

-- Profiles: users can only read/write their own profile
create policy "profiles: owner access" on profiles
  for all using (auth.uid() = id);

-- Characters: fully private per user
create policy "characters: owner access" on characters
  for all using (auth.uid() = user_id);

-- Campaigns: fully private per user
create policy "campaigns: owner access" on campaigns
  for all using (auth.uid() = user_id);

-- Campaign sessions: accessible if the parent campaign belongs to the user
create policy "campaign_sessions: owner access" on campaign_sessions
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_sessions.campaign_id
        and c.user_id = auth.uid()
    )
  );

-- NPCs: same
create policy "npcs: owner access" on npcs
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = npcs.campaign_id
        and c.user_id = auth.uid()
    )
  );

-- Campaign notes: same
create policy "campaign_notes: owner access" on campaign_notes
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_notes.campaign_id
        and c.user_id = auth.uid()
    )
  );

-- ── Storage: portraits bucket ────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('portraits', 'portraits', true, 2097152)  -- 2 MB
on conflict (id) do nothing;

create policy "portraits: owner upload" on storage.objects
  for insert with check (
    bucket_id = 'portraits' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "portraits: owner update" on storage.objects
  for update using (
    bucket_id = 'portraits' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- No broad SELECT policy: the bucket is public so files are accessible by direct
-- URL without a policy. A broad SELECT would allow unauthenticated listing of
-- all files, which is unnecessary and exposes user IDs.

create policy "portraits: owner delete" on storage.objects
  for delete using (
    bucket_id = 'portraits' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ── updated_at auto-update trigger ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on characters
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on campaigns
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on campaign_sessions
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on npcs
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on campaign_notes
  for each row execute procedure set_updated_at();
