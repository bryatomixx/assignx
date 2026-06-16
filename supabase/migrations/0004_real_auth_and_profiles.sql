-- =============================================================================
-- AssignX Agency Partners Academy - Real Auth, Editable Profiles, Audit Trail
-- Migration: 0004_real_auth_and_profiles.sql
-- Apply manually via Supabase SQL Editor (service_role / postgres privilege).
-- Idempotent: every destructive or creative statement is guarded.
--
-- What this migration does, in order:
--   A) Adds bio, avatar_url, timezone, updated_at columns to profiles.
--   B) Seeds auth.users + auth.identities for all 7 users (5 demo + 2 admins)
--      with fixed UUIDs, bcrypt-hashed passwords, and pre-confirmed emails.
--   C) Upserts the 2 admin rows into public.profiles.
--   D) Restores the FK profiles.id -> auth.users(id) ON DELETE CASCADE.
--   E) Creates profile_change_history audit table with indexes and RLS.
--   F) Adds/adjusts RLS policies for profiles (UPDATE guard already exists).
--
-- DESIGN DECISION - why SQL INSERT into auth.* instead of a Node script:
--   The 5 demo users carry FIXED UUIDs referenced by posts, comments, likes,
--   follows, lesson_progress, homework, and module_access rows already in the
--   DB. auth.admin.createUser() (supabase-js) does not accept a custom UUID,
--   so it cannot reuse those UUIDs. Inserting directly into auth.users and
--   auth.identities via SQL (privileged role, no RLS) is the only reliable
--   way to create auth rows with a specific UUID. All GoTrue NOT NULL columns
--   are explicitly populated. The 2 real admins use new fixed UUIDs so they
--   are equally reproducible and auditable.
--
-- Admin credentials:
--   noahdeveloperr@gmail.com  / 111333  UUID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
--   alex@assignx.ai           / 111333  UUID: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
--
-- AFTER running this migration do ONE thing in the Supabase dashboard:
--   Auth -> Settings -> "Enable email confirmations" -> OFF
--   This makes new self-signup users land as confirmed immediately.
--   The 7 seeded users are already confirmed via email_confirmed_at in SQL.
-- =============================================================================


-- =============================================================================
-- A. PROFILES SCHEMA ADDITIONS
-- =============================================================================

-- A.1 bio: free-text self-description, optional.
alter table public.profiles
  add column if not exists bio text;

-- A.2 avatar_url: URL of uploaded photo in the avatars bucket.
--     The existing `avatar` (emoji) column stays as fallback display value.
alter table public.profiles
  add column if not exists avatar_url text;

-- A.3 timezone: IANA timezone string for local display of UTC timestamps.
--     Default is America/Los_Angeles (PST/PDT). All timestamps in the DB
--     are stored as timestamptz (UTC); this column only drives UI formatting.
alter table public.profiles
  add column if not exists timezone text not null default 'America/Los_Angeles';

-- A.4 updated_at: tracks the last time a profile row was modified.
--     The trigger function set_updated_at() already exists from 0001.
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- Attach the existing trigger to profiles (idempotent: drop first).
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- =============================================================================
-- B. SEED auth.users AND auth.identities
--
-- Columns required by GoTrue (NOT NULL, no server default):
--   auth.users:
--     instance_id uuid               -> '00000000-0000-0000-0000-000000000000'
--     aud text                       -> 'authenticated'
--     role text                      -> 'authenticated'
--     email text
--     encrypted_password text        -> bcrypt hash via extensions.crypt()
--     email_confirmed_at timestamptz -> now() (pre-confirms the user)
--     created_at timestamptz         -> now()
--     updated_at timestamptz         -> now()
--     confirmation_token text        -> '' (empty string, GoTrue requires this col)
--     recovery_token text            -> '' (same reason)
--     email_change text              -> '' (in-progress email change; none)
--     email_change_token_new text    -> '' (token for that change; none)
--     raw_app_meta_data jsonb        -> '{"provider":"email","providers":["email"]}'
--     raw_user_meta_data jsonb       -> '{}' or name/avatar
--     is_super_admin boolean         -> false
--     is_sso_user boolean            -> false
--     deleted_at timestamptz         -> null (not deleted)
--
--   auth.identities:
--     id uuid                        -> gen_random_uuid() (identities own PK, a uuid)
--     provider_id text               -> the user UUID as text (email provider sub)
--     user_id uuid                   -> FK to auth.users(id)
--     identity_data jsonb            -> {"sub": "<uuid>", "email": "<email>"}
--     provider text                  -> 'email'
--     last_sign_in_at timestamptz    -> now()
--     created_at timestamptz         -> now()
--     updated_at timestamptz         -> now()
--
-- Every INSERT is guarded by ON CONFLICT DO NOTHING so re-running is safe.
-- =============================================================================

-- ---- B.1 Demo user: Noah Nega (u-admin) -------------------------------------
-- UUID: 11111111-1111-1111-1111-111111111111
-- email: noah@assignx.ai (same as demo profile; used for dashboard login)
-- role in profiles: admin
-- Note: this demo email is a placeholder; real Noah logs in as noahdeveloperr@gmail.com
--       (UUID aaaaaaaa-...). This row exists solely to back the FK for demo seed data.

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'noah@assignx.ai',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Noah Nega","avatar":"🧑🏻‍💼"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"noah@assignx.ai"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- ---- B.2 Demo user: Test Member (u-test) ------------------------------------
-- UUID: 22222222-2222-2222-2222-222222222222

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'test@partner.io',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Test Member","avatar":"🧑🏻‍💻"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"test@partner.io"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- ---- B.3 Demo user: Jon S. (u-jon) ------------------------------------------
-- UUID: 33333333-3333-3333-3333-333333333333

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'jon@partner.io',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Jon S.","avatar":"🧔🏻"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '{"sub":"33333333-3333-3333-3333-333333333333","email":"jon@partner.io"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- ---- B.4 Demo user: Michelle N. (u-michelle) --------------------------------
-- UUID: 44444444-4444-4444-4444-444444444444

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated',
  'authenticated',
  'michelle@partner.io',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Michelle N.","avatar":"👩🏽‍🦱"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  '{"sub":"44444444-4444-4444-4444-444444444444","email":"michelle@partner.io"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- ---- B.5 Demo user: Stevie F. (u-stevie) ------------------------------------
-- UUID: 55555555-5555-5555-5555-555555555555

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '55555555-5555-5555-5555-555555555555',
  'authenticated',
  'authenticated',
  'stevie@partner.io',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Stevie F.","avatar":"👨🏼‍🦰"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  '55555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555555',
  '{"sub":"55555555-5555-5555-5555-555555555555","email":"stevie@partner.io"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- ---- B.6 Real admin: Noah (noahdeveloperr@gmail.com) ------------------------
-- UUID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- This is the real login for Noah. Different UUID from the demo u-admin row.

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'noahdeveloperr@gmail.com',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Noah Nega","avatar":"🧑🏻‍💼"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"noahdeveloperr@gmail.com"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- ---- B.7 Real admin: Alex (alex@assignx.ai) ---------------------------------
-- UUID: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'authenticated',
  'authenticated',
  'alex@assignx.ai',
  extensions.crypt('111333', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Alex","avatar":"🧑‍💻"}',
  false, false,
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"alex@assignx.ai"}',
  'email',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;


-- =============================================================================
-- C. UPSERT admin profile rows for the 2 real admins
--    The handle_new_user trigger fires on INSERT into auth.users and calls
--    "insert into profiles ... on conflict do nothing". Because the profiles
--    rows for aaaaaaaa and bbbbbbbb do not exist yet, the trigger will have
--    already inserted them with role='student'. We upsert here to ensure the
--    correct role='admin' and any other defaults.
--    If the trigger already ran and set role correctly, this is a no-op on
--    role/status but ensures name and avatar match.
-- =============================================================================

insert into public.profiles
  (id, name, email, role, status, avatar, auto_approve, joined_at, timezone)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Noah Nega',
    'noahdeveloperr@gmail.com',
    'admin',
    'active',
    '🧑🏻‍💼',
    false,
    now(),
    'America/Los_Angeles'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Alex',
    'alex@assignx.ai',
    'admin',
    'active',
    '🧑‍💻',
    false,
    now(),
    'America/Los_Angeles'
  )
on conflict (id) do update
  set
    name         = excluded.name,
    email        = excluded.email,
    role         = 'admin',
    status       = 'active',
    avatar       = excluded.avatar,
    auto_approve = excluded.auto_approve,
    timezone     = excluded.timezone;

-- Ensure the 5 demo profiles get the new columns with correct defaults.
-- bio and avatar_url remain null; timezone and updated_at default to
-- 'America/Los_Angeles' and now() respectively from the column definitions,
-- so this update is only needed if the rows were inserted before the column
-- was added (which is the case: 0002 ran before 0004).
update public.profiles
set timezone   = coalesce(timezone, 'America/Los_Angeles'),
    updated_at = coalesce(updated_at, now())
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);


-- =============================================================================
-- D. RESTORE FK: profiles.id -> auth.users(id) ON DELETE CASCADE
--
-- The FK was dropped in 0002 to allow demo profiles without auth rows.
-- Now that all 7 profiles have backing auth.users rows, we can restore it.
-- add constraint ... if not exists is NOT supported in older PG; use a DO
-- block to check pg_constraint first.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;


-- =============================================================================
-- E. AUDIT TABLE: profile_change_history
-- =============================================================================

create table if not exists public.profile_change_history (
  id          uuid        primary key default gen_random_uuid(),
  -- whose profile changed
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  -- who made the change (self-edit or admin action); null if actor was deleted
  changed_by  uuid        references public.profiles(id) on delete set null,
  -- which field changed (constrained to known fields)
  field       text        not null
                check (field in ('name','email','bio','avatar_url','password','role','status','timezone')),
  -- before/after values; both are null when field = 'password' (never store)
  old_value   text,
  new_value   text,
  -- always stored as UTC; the app displays in user timezone using profiles.timezone
  created_at  timestamptz not null default now()
);

comment on table public.profile_change_history is
  'Append-only audit log for profile field changes. '
  'For password changes, old_value and new_value are always null. '
  'created_at is UTC; display in the local timezone using profiles.timezone.';

comment on column public.profile_change_history.field is
  'One of: name, email, bio, avatar_url, password, role, status, timezone';

-- Indexes for the two primary access patterns:
--   1. "show audit history for this profile" (admin or self view)
--   2. "show most recent changes" (admin dashboard)
create index if not exists idx_pch_profile_id
  on public.profile_change_history (profile_id, created_at desc);

create index if not exists idx_pch_created_at
  on public.profile_change_history (created_at desc);


-- =============================================================================
-- F. RLS FOR profile_change_history
-- =============================================================================

alter table public.profile_change_history enable row level security;

-- Admin can read the full audit log.
-- Profile owner can read their own history.
-- The policy is a single permissive rule combining both actors.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profile_change_history'
      and policyname = 'pch_select'
  ) then
    execute $policy$
      create policy "pch_select"
        on public.profile_change_history for select
        to authenticated
        using (
          public.is_admin()
          or profile_id = auth.uid()
        )
    $policy$;
  end if;
end $$;

-- INSERT: authenticated users may log changes to their own profile.
-- Admins may log changes they made to any profile (changed_by = auth.uid()).
-- The service_role (Edge Functions, triggers) bypasses RLS entirely.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profile_change_history'
      and policyname = 'pch_insert'
  ) then
    execute $policy$
      create policy "pch_insert"
        on public.profile_change_history for insert
        to authenticated
        with check (
          -- the actor column must always be the caller
          changed_by = auth.uid()
          -- the profile being logged must be the caller's own, OR the caller is admin
          and (profile_id = auth.uid() or public.is_admin())
        )
    $policy$;
  end if;
end $$;

-- No UPDATE or DELETE: the audit log is append-only.
-- (No policies for those operations = no authenticated access = correct.)


-- =============================================================================
-- G. RLS POLICY ADDITIONS FOR profiles
--
-- The existing policies from 0001 are kept unchanged:
--   profiles_select_authenticated  - all authenticated can read
--   profiles_update_own            - user edits own row (no role/status change)
--   profiles_update_admin          - admin edits any row
--   profiles_delete_admin          - admin deletes any row
--
-- The new columns (bio, avatar_url, timezone) are automatically covered by
-- profiles_update_own because that policy uses no WITH CHECK restriction on
-- those columns (it only prevents changing role/status). No new policy is
-- needed for the profile fields themselves.
--
-- We add one policy to prevent authenticated INSERT from non-trigger paths.
-- INSERT is already handled exclusively by handle_new_user (service role).
-- The policy below makes the intent explicit and blocks any rogue client call.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'profiles_insert_blocked'
  ) then
    execute $policy$
      create policy "profiles_insert_blocked"
        on public.profiles for insert
        to authenticated
        with check (false)
    $policy$;
  end if;
end $$;

-- =============================================================================
-- END OF MIGRATION 0004
-- =============================================================================
