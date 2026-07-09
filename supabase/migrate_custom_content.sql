-- Migration: custom content (homebrew races & classes) + community sharing
-- Run once in the Supabase SQL editor. Idempotent — safe to re-run.
-- Depends on the base schema (uuid-ossp extension + public.set_updated_at()).

-- ── custom_races ────────────────────────────────────────────────────────────
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

-- ── custom_classes ──────────────────────────────────────────────────────────
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

-- ── Row-Level Security: public read (shared OR own), owner-only writes ─────────
-- Unlike the fully-private "for all" policies, community content needs public
-- SELECT. Split into per-verb policies (mirrors the storage `portraits` bucket).
alter table custom_races   enable row level security;
alter table custom_classes enable row level security;

drop policy if exists "custom_races: public read"  on custom_races;
drop policy if exists "custom_races: owner insert" on custom_races;
drop policy if exists "custom_races: owner update" on custom_races;
drop policy if exists "custom_races: owner delete" on custom_races;

create policy "custom_races: public read" on custom_races
  for select using (is_public or auth.uid() = user_id);
create policy "custom_races: owner insert" on custom_races
  for insert with check (auth.uid() = user_id);
create policy "custom_races: owner update" on custom_races
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_races: owner delete" on custom_races
  for delete using (auth.uid() = user_id);

drop policy if exists "custom_classes: public read"  on custom_classes;
drop policy if exists "custom_classes: owner insert" on custom_classes;
drop policy if exists "custom_classes: owner update" on custom_classes;
drop policy if exists "custom_classes: owner delete" on custom_classes;

create policy "custom_classes: public read" on custom_classes
  for select using (is_public or auth.uid() = user_id);
create policy "custom_classes: owner insert" on custom_classes
  for insert with check (auth.uid() = user_id);
create policy "custom_classes: owner update" on custom_classes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_classes: owner delete" on custom_classes
  for delete using (auth.uid() = user_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
drop trigger if exists set_updated_at on custom_races;
create trigger set_updated_at before update on custom_races
  for each row execute procedure set_updated_at();

drop trigger if exists set_updated_at on custom_classes;
create trigger set_updated_at before update on custom_classes
  for each row execute procedure set_updated_at();
