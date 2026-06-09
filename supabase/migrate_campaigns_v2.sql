-- Migration: campaigns v2 — personal tracking model
-- Run once in the Supabase SQL editor.

-- ── 1. campaigns: replace linked_character_ids with my_character_id / my_character_name ──
alter table campaigns
  add column if not exists my_character_id   uuid references characters(id) on delete set null,
  add column if not exists my_character_name text;

alter table campaigns
  drop column if exists linked_character_ids;

-- ── 2. campaign_party_members (new table) ────────────────────────────────────
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

create index if not exists campaign_party_members_campaign_id_idx
  on campaign_party_members(campaign_id);

alter table campaign_party_members enable row level security;

create policy "campaign_party_members: owner access" on campaign_party_members
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_party_members.campaign_id
        and c.user_id = auth.uid()
    )
  );

create trigger set_updated_at before update on campaign_party_members
  for each row execute procedure set_updated_at();

-- ── 3. campaign_key_objects (new table) ──────────────────────────────────────
create table if not exists campaign_key_objects (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  name        text not null,
  description text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists campaign_key_objects_campaign_id_idx
  on campaign_key_objects(campaign_id);

alter table campaign_key_objects enable row level security;

create policy "campaign_key_objects: owner access" on campaign_key_objects
  for all using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_key_objects.campaign_id
        and c.user_id = auth.uid()
    )
  );

create trigger set_updated_at before update on campaign_key_objects
  for each row execute procedure set_updated_at();

-- ── 4. campaign_sessions: drop summary and tags columns ──────────────────────
alter table campaign_sessions
  drop column if exists summary,
  drop column if exists tags;

-- ── 5. npcs: simplify to name + description only ─────────────────────────────
alter table npcs
  drop column if exists race,
  drop column if exists occupation,
  drop column if exists alignment,
  drop column if exists notes,
  drop column if exists tags,
  drop column if exists is_alive;

-- ── 6. campaign_notes: drop tags column ──────────────────────────────────────
alter table campaign_notes
  drop column if exists tags;

-- ── 7. session body + session_id FK on sub-entities ──────────────────────────
alter table campaign_sessions
  add column if not exists body text not null default '';

alter table npcs
  add column if not exists session_id uuid references campaign_sessions(id) on delete set null;

alter table campaign_notes
  add column if not exists session_id uuid references campaign_sessions(id) on delete set null;

alter table campaign_key_objects
  add column if not exists session_id uuid references campaign_sessions(id) on delete set null;
