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
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  name               text not null,
  description        text,
  tags               text[] default '{}',
  my_character_id    uuid references characters(id) on delete set null,
  my_character_name  text,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

create index if not exists campaigns_user_id_idx on campaigns(user_id);

-- ── Campaign party members ────────────────────────────────────────────────────
create table if not exists campaign_party_members (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name        text not null,
  player      text,
  description text,
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists campaign_party_members_campaign_id_idx on campaign_party_members(campaign_id);

-- ── Campaign sessions ─────────────────────────────────────────────────────────
create table if not exists campaign_sessions (
  id             uuid primary key default uuid_generate_v4(),
  campaign_id    uuid references campaigns(id) on delete cascade not null,
  session_number smallint not null default 1,
  title          text,
  date           date,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

create index if not exists campaign_sessions_campaign_id_idx on campaign_sessions(campaign_id);

-- ── NPCs ──────────────────────────────────────────────────────────────────────
create table if not exists npcs (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name        text not null,
  description text,
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
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists campaign_notes_campaign_id_idx on campaign_notes(campaign_id);

-- ── Key objects ───────────────────────────────────────────────────────────────
create table if not exists campaign_key_objects (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name        text not null,
  description text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists campaign_key_objects_campaign_id_idx on campaign_key_objects(campaign_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table characters enable row level security;
alter table campaigns enable row level security;
alter table campaign_sessions enable row level security;
alter table npcs enable row level security;
alter table campaign_notes enable row level security;
alter table campaign_party_members enable row level security;
alter table campaign_key_objects enable row level security;

-- Profiles: users can only read/write their own profile
create policy "profiles: owner access" on profiles
  for all using (auth.uid() = id);

-- Characters: fully private per user
create policy "characters: owner access" on characters
  for all using (auth.uid() = user_id);

-- Campaigns: fully private per user
create policy "campaigns: owner access" on campaigns
  for all using (auth.uid() = user_id);

-- Sub-entities: accessible if the parent campaign belongs to the user
create policy "campaign_sessions: owner access" on campaign_sessions
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_sessions.campaign_id
        and c.user_id = auth.uid()
    )
  );

create policy "npcs: owner access" on npcs
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = npcs.campaign_id
        and c.user_id = auth.uid()
    )
  );

create policy "campaign_notes: owner access" on campaign_notes
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_notes.campaign_id
        and c.user_id = auth.uid()
    )
  );

create policy "campaign_party_members: owner access" on campaign_party_members
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_party_members.campaign_id
        and c.user_id = auth.uid()
    )
  );

create policy "campaign_key_objects: owner access" on campaign_key_objects
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_key_objects.campaign_id
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

-- Owner SELECT is required for upsert: Supabase needs to check row existence
-- before deciding INSERT vs UPDATE. Scoped to the owner's folder only, so
-- unauthenticated users cannot list files.
create policy "portraits: owner select" on storage.objects
  for select using (
    bucket_id = 'portraits' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

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
create trigger set_updated_at before update on campaign_party_members
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on campaign_key_objects
  for each row execute procedure set_updated_at();

-- ── Custom content (homebrew races & classes) + community sharing ─────────────
-- Player-authored races/classes. Unlike other tables, these support PUBLIC read
-- (community listing) so RLS uses split-verb policies: read = shared OR own,
-- writes = owner only. See migrate_custom_content.sql for the standalone migration.
create table if not exists custom_races (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  edition      text not null default '2014',
  primary_stat text,               -- ability with the highest bonus (community sort)
  is_public    boolean not null default false,
  author_name  text,               -- denormalized display name for community attribution
  data         jsonb not null,     -- full CustomRace definition
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);
create index if not exists custom_races_user_id_idx    on custom_races(user_id);
create index if not exists custom_races_public_idx      on custom_races(is_public) where is_public;
create index if not exists custom_races_updated_at_idx  on custom_races(updated_at desc);
create index if not exists custom_races_data_gin        on custom_races using gin(data);

create table if not exists custom_classes (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  edition      text not null default '2014',
  primary_stat text,
  is_public    boolean not null default false,
  author_name  text,
  data         jsonb not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);
create index if not exists custom_classes_user_id_idx   on custom_classes(user_id);
create index if not exists custom_classes_public_idx     on custom_classes(is_public) where is_public;
create index if not exists custom_classes_updated_at_idx on custom_classes(updated_at desc);
create index if not exists custom_classes_data_gin       on custom_classes using gin(data);

create table if not exists custom_subclasses (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  edition       text not null default '2014',
  parent_class  text not null,      -- SRD class index or custom class id
  is_public     boolean not null default false,
  author_name   text,
  data          jsonb not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);
create index if not exists custom_subclasses_user_id_idx    on custom_subclasses(user_id);
create index if not exists custom_subclasses_public_idx      on custom_subclasses(is_public) where is_public;
create index if not exists custom_subclasses_parent_idx      on custom_subclasses(parent_class);
create index if not exists custom_subclasses_updated_at_idx  on custom_subclasses(updated_at desc);
create index if not exists custom_subclasses_data_gin        on custom_subclasses using gin(data);

alter table custom_races      enable row level security;
alter table custom_classes    enable row level security;
alter table custom_subclasses enable row level security;

create policy "custom_races: public read" on custom_races
  for select using (is_public or auth.uid() = user_id);
create policy "custom_races: owner insert" on custom_races
  for insert with check (auth.uid() = user_id);
create policy "custom_races: owner update" on custom_races
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_races: owner delete" on custom_races
  for delete using (auth.uid() = user_id);

create policy "custom_classes: public read" on custom_classes
  for select using (is_public or auth.uid() = user_id);
create policy "custom_classes: owner insert" on custom_classes
  for insert with check (auth.uid() = user_id);
create policy "custom_classes: owner update" on custom_classes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_classes: owner delete" on custom_classes
  for delete using (auth.uid() = user_id);

create policy "custom_subclasses: public read" on custom_subclasses
  for select using (is_public or auth.uid() = user_id);
create policy "custom_subclasses: owner insert" on custom_subclasses
  for insert with check (auth.uid() = user_id);
create policy "custom_subclasses: owner update" on custom_subclasses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_subclasses: owner delete" on custom_subclasses
  for delete using (auth.uid() = user_id);

create trigger set_updated_at before update on custom_races
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on custom_classes
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on custom_subclasses
  for each row execute procedure set_updated_at();
