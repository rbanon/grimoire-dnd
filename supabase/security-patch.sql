-- Security patch, apply once to the existing Supabase project via SQL editor.
-- Fixes all WARN-level findings from the Supabase database linter.

-- ── 1. Fix mutable search_path on handle_new_user ────────────────────────────
-- Prevents search_path injection attacks on a SECURITY DEFINER function.
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

-- ── 2. Revoke direct execution of handle_new_user ────────────────────────────
-- This function is only meant to fire as an INSERT trigger on auth.users.
-- It must not be callable via /rest/v1/rpc/handle_new_user.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ── 3. Fix mutable search_path on set_updated_at ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 4. Remove broad SELECT policy on portraits bucket ────────────────────────
-- The bucket is already public=true, so files are accessible by direct URL
-- without any policy. The broad SELECT was allowing unauthenticated listing
-- of all files (exposing user IDs). Dropping it stops listing while keeping
-- public URL access intact.
drop policy if exists "portraits: public read" on storage.objects;

-- ── 5. Leaked password protection ────────────────────────────────────────────
-- Cannot be fixed via SQL. Enable it in:
-- Supabase Dashboard → Authentication → Passwords → "Enable Leaked Password Protection"
