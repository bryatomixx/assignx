-- =============================================================================
-- AssignX Agency Partners Academy -- Initial Schema
-- Migration: 0001_initial_schema.sql
-- Apply manually via Supabase SQL Editor on a clean (new) project.
-- Run once: "create policy" has no IF NOT EXISTS, so re-running on a DB that
-- already has these policies errors on duplicate names.
-- Assumes: extensions, auth schema, and storage schema are already present
-- (they are in every Supabase project by default).
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid() on older PG

-- Helper functions below reference tables created later in this script. Defer
-- function-body validation to call time (by then the tables exist) so the
-- script runs top to bottom on a clean database.
set check_function_bodies = off;


-- =============================================================================
-- 2. ENUMS
-- =============================================================================

do $$ begin
  create type public.user_role as enum ('admin', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('active', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.module_tier as enum ('free', 'paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_media_type as enum ('text', 'image', 'video', 'link');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'like', 'comment', 'follow',
    'post_approved', 'post_rejected', 'post_pending'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;


-- =============================================================================
-- 3. SECURITY-DEFINER HELPER FUNCTIONS
-- These live in public but have a fixed search_path to prevent search_path
-- hijacking. They read from profiles without triggering an RLS policy that
-- itself queries profiles, breaking infinite-recursion.
-- =============================================================================

-- Returns true when the calling JWT belongs to an admin profile.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Returns true when the caller is admin OR is a moderator with the given
-- permission column set to true.
-- perm must match an actual boolean column name on public.moderators.
create or replace function public.is_mod_with(perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _result boolean := false;
begin
  if public.is_admin() then
    return true;
  end if;
  execute format(
    'select coalesce((%I)::boolean, false)
       from public.moderators
      where user_id = $1',
    perm
  )
  into _result
  using auth.uid();
  return coalesce(_result, false);
end;
$$;

-- Convenience wrapper: returns the role text for the calling user.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.profiles
  where id = auth.uid();
$$;


-- =============================================================================
-- 4. TABLES
-- Order respects FK dependencies.
-- =============================================================================

-- ---- 4.1 profiles (one row per auth.users entry) ----------------------------

create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  name          text        not null default '',
  email         text        not null default '',
  role          public.user_role   not null default 'student',
  status        public.user_status not null default 'active',
  avatar        text        not null default '',
  -- When true this profile's posts bypass the global approval queue.
  -- Mirrors CommunitySettings.autoApproveUserIds from the mock layer.
  auto_approve  boolean     not null default false,
  joined_at     timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user. Mirrors the User type from lib/types.ts.';

-- ---- 4.2 moderators (community board moderators, subset of profiles) --------

create table if not exists public.moderators (
  user_id              uuid    primary key references public.profiles(id) on delete cascade,
  can_approve_posts    boolean not null default false,
  can_delete_posts     boolean not null default false,
  can_delete_comments  boolean not null default false,
  can_pin_content      boolean not null default false,
  can_manage_approval  boolean not null default false
);

comment on table public.moderators is
  'Mirrors ModPermissions from lib/types.ts. A profile row here means the '
  'user has a mod role in the community board.';

-- ---- 4.3 modules ------------------------------------------------------------

create table if not exists public.modules (
  id          text        primary key,  -- e.g. "mod-30-day"
  slug        text        not null unique,
  title       text        not null,
  description text        not null default '',
  position    integer     not null default 0,  -- mirrors Module.order
  access      public.module_tier not null default 'free',
  icon        text        not null default '',  -- lucide icon name as string
  accent      text        not null default ''   -- CSS gradient string
);

comment on column public.modules.icon is
  'Lucide icon name (string). The React component mapping happens client-side.';

-- ---- 4.4 lessons ------------------------------------------------------------

create table if not exists public.lessons (
  id           text    primary key,   -- e.g. "orientation", "w1d1"
  module_id    text    not null references public.modules(id) on delete cascade,
  slug         text    not null,
  title        text    not null,
  subtitle     text,
  position     integer not null default 0,
  duration_min integer not null default 0,
  content      text    not null default '',
  unique (module_id, slug)
);

-- ---- 4.5 lesson_clips (video playlist per lesson) ---------------------------

create table if not exists public.lesson_clips (
  id           uuid    primary key default gen_random_uuid(),
  lesson_id    text    not null references public.lessons(id) on delete cascade,
  idx          integer not null,  -- zero-based position within the lesson playlist
  title        text    not null,
  video_url    text    not null default '',
  duration_sec integer not null default 0,
  unique (lesson_id, idx)
);

-- ---- 4.6 lesson_resources ---------------------------------------------------

create table if not exists public.lesson_resources (
  id        uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons(id) on delete cascade,
  label     text not null,
  href      text not null
);

-- ---- 4.7 module_access (admin grants paid module access per user) ------------

create table if not exists public.module_access (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  module_id   text not null references public.modules(id) on delete cascade,
  granted_by  uuid references public.profiles(id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (user_id, module_id)
);

comment on table public.module_access is
  'Mirrors User.unlockedModuleIds. Free modules do not need a row here; '
  'access logic checks modules.access = ''free'' first.';

-- ---- 4.8 lesson_progress ----------------------------------------------------

create table if not exists public.lesson_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    text not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ---- 4.9 homework -----------------------------------------------------------

create table if not exists public.homework (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  done_at   timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ---- 4.10 video_progress ----------------------------------------------------

create table if not exists public.video_progress (
  user_id      uuid    not null references public.profiles(id) on delete cascade,
  lesson_id    text    not null references public.lessons(id) on delete cascade,
  clip_index   integer not null,
  elapsed_sec  numeric not null default 0,
  duration_sec numeric not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id, clip_index)
);

-- ---- 4.11 posts -------------------------------------------------------------

create table if not exists public.posts (
  id            uuid        primary key default gen_random_uuid(),
  author_id     uuid        not null references public.profiles(id) on delete cascade,
  body          text        not null check (char_length(body) <= 2000),
  media_type    public.post_media_type not null default 'text',
  media_payload text,
  status        public.post_status    not null default 'pending',
  pinned        boolean     not null default false,
  approved_by   uuid        references public.profiles(id) on delete set null,
  approved_at   timestamptz,
  rejected_by   uuid        references public.profiles(id) on delete set null,
  rejected_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---- 4.12 comments ----------------------------------------------------------

create table if not exists public.comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  author_id  uuid        not null references public.profiles(id) on delete cascade,
  body       text        not null check (char_length(body) <= 500),
  pinned     boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ---- 4.13 post_likes --------------------------------------------------------

create table if not exists public.post_likes (
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  post_id    uuid        not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ---- 4.14 follows -----------------------------------------------------------

create table if not exists public.follows (
  follower_id uuid        not null references public.profiles(id) on delete cascade,
  followee_id uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- ---- 4.15 notifications -----------------------------------------------------
-- INSERT is done by application logic (Edge Function or DB trigger).
-- Decision: allow INSERT for authenticated users so client-side actions
-- (like, comment, follow) can fan-out notifications. Service role bypasses RLS
-- for any server-side fan-out. The comment_id column is added here even though
-- the AppNotification type does not include it yet; it keeps the schema
-- forward-compatible for the comment-notification linkage.

create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  recipient_id uuid        not null references public.profiles(id) on delete cascade,
  actor_id     uuid        not null references public.profiles(id) on delete cascade,
  type         public.notification_type not null,
  post_id      uuid        references public.posts(id) on delete cascade,
  comment_id   uuid        references public.comments(id) on delete cascade,
  read         boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- ---- 4.16 community_settings (singleton) ------------------------------------

create table if not exists public.community_settings (
  id              integer primary key default 1 check (id = 1),
  global_approval boolean not null default true
);

comment on table public.community_settings is
  'Singleton row (id always = 1). global_approval mirrors '
  'CommunitySettings.globalApproval. Per-user auto_approve lives on profiles.';

-- Seed the singleton so it always exists.
insert into public.community_settings (id, global_approval)
values (1, true)
on conflict (id) do nothing;

-- ---- 4.17 post_reports ------------------------------------------------------

create table if not exists public.post_reports (
  id          uuid        primary key default gen_random_uuid(),
  reporter_id uuid        not null references public.profiles(id) on delete cascade,
  post_id     uuid        references public.posts(id) on delete cascade,
  comment_id  uuid        references public.comments(id) on delete cascade,
  reason      text        not null default '',
  status      public.report_status not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_by uuid        references public.profiles(id) on delete set null,
  resolved_at timestamptz
);

-- ---- 4.18 moderation_log (audit trail) --------------------------------------

create table if not exists public.moderation_log (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        references public.profiles(id) on delete set null,
  action      text        not null,   -- e.g. 'approve', 'reject', 'delete', 'pin', 'promote', 'unlock', 'remove'
  target_type text        not null,   -- e.g. 'post', 'comment', 'user', 'module_access'
  target_id   text        not null,   -- stringified id of the target row
  created_at  timestamptz not null default now()
);

-- ---- 4.19 invites -----------------------------------------------------------

create table if not exists public.invites (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  role        public.user_role not null default 'student',
  token       text        not null unique,
  status      text        not null default 'pending',  -- pending, accepted, expired
  invited_by  uuid        references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz
);


-- =============================================================================
-- 5. INDEXES
-- Covering FK columns (Postgres does not auto-index FKs) and common
-- filter/sort columns.
-- =============================================================================

-- profiles
create index if not exists idx_profiles_role   on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- modules
create index if not exists idx_modules_position on public.modules(position);
create index if not exists idx_modules_access   on public.modules(access);

-- lessons
create index if not exists idx_lessons_module_id on public.lessons(module_id);
create index if not exists idx_lessons_position  on public.lessons(module_id, position);

-- lesson_clips
create index if not exists idx_lesson_clips_lesson_id on public.lesson_clips(lesson_id);

-- lesson_resources
create index if not exists idx_lesson_resources_lesson_id on public.lesson_resources(lesson_id);

-- module_access
create index if not exists idx_module_access_user_id   on public.module_access(user_id);
create index if not exists idx_module_access_module_id on public.module_access(module_id);

-- lesson_progress
create index if not exists idx_lesson_progress_user_id   on public.lesson_progress(user_id);
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress(lesson_id);

-- homework
create index if not exists idx_homework_user_id   on public.homework(user_id);
create index if not exists idx_homework_lesson_id on public.homework(lesson_id);

-- video_progress
create index if not exists idx_video_progress_user_lesson on public.video_progress(user_id, lesson_id);

-- posts
create index if not exists idx_posts_author_id  on public.posts(author_id);
create index if not exists idx_posts_status     on public.posts(status);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_pinned     on public.posts(pinned) where pinned = true;

-- comments
create index if not exists idx_comments_post_id   on public.comments(post_id);
create index if not exists idx_comments_author_id on public.comments(author_id);
create index if not exists idx_comments_created_at on public.comments(created_at);

-- post_likes
create index if not exists idx_post_likes_post_id  on public.post_likes(post_id);
create index if not exists idx_post_likes_user_id  on public.post_likes(user_id);

-- follows
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_followee_id on public.follows(followee_id);

-- notifications
create index if not exists idx_notifications_recipient_id on public.notifications(recipient_id);
create index if not exists idx_notifications_read         on public.notifications(recipient_id, read) where read = false;

-- post_reports
create index if not exists idx_post_reports_status      on public.post_reports(status);
create index if not exists idx_post_reports_reporter_id on public.post_reports(reporter_id);
create index if not exists idx_post_reports_post_id     on public.post_reports(post_id);

-- moderation_log
create index if not exists idx_moderation_log_actor_id   on public.moderation_log(actor_id);
create index if not exists idx_moderation_log_created_at on public.moderation_log(created_at desc);

-- invites
create index if not exists idx_invites_email  on public.invites(email);
create index if not exists idx_invites_status on public.invites(status);


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- 6.1 handle_new_user: auto-create a profiles row on auth.users INSERT.
-- SECURITY DEFINER so the trigger can write to profiles even without an
-- authenticated session (it runs as the function owner, typically postgres).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, status, avatar, joined_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    'student',
    'active',
    coalesce(new.raw_user_meta_data->>'avatar', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6.2 updated_at maintenance for posts.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 7. ROW LEVEL SECURITY -- ENABLE
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.moderators          enable row level security;
alter table public.modules             enable row level security;
alter table public.lessons             enable row level security;
alter table public.lesson_clips        enable row level security;
alter table public.lesson_resources    enable row level security;
alter table public.module_access       enable row level security;
alter table public.lesson_progress     enable row level security;
alter table public.homework            enable row level security;
alter table public.video_progress      enable row level security;
alter table public.posts               enable row level security;
alter table public.comments            enable row level security;
alter table public.post_likes          enable row level security;
alter table public.follows             enable row level security;
alter table public.notifications       enable row level security;
alter table public.community_settings  enable row level security;
alter table public.post_reports        enable row level security;
alter table public.moderation_log      enable row level security;
alter table public.invites             enable row level security;


-- =============================================================================
-- 8. ROW LEVEL SECURITY -- POLICIES
-- Assumes a clean DB (no prior policies). service_role always bypasses RLS.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 profiles
-- ----------------------------------------------------------------------------

-- Any authenticated user can read public profile fields.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- A user can update their own row but cannot change role or status.
-- Admin can update any row (including role/status) via the admin policy below.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using  (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent self-promotion: new role/status must equal existing values
    and role   = (select role   from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

-- Admin can update any profile (role, status, etc.).
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

-- INSERT is handled exclusively by the handle_new_user trigger (service role).
-- No authenticated INSERT policy is needed.

-- Admin can delete a profile (cascades to auth.users via FK in reverse; use
-- Supabase admin API to also remove from auth.users).
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.2 moderators
-- ----------------------------------------------------------------------------

-- Authenticated users can read the moderators table (to check who is a mod).
create policy "moderators_select_authenticated"
  on public.moderators for select
  to authenticated
  using (true);

-- Only admin can insert, update, or delete moderator rows.
create policy "moderators_insert_admin"
  on public.moderators for insert
  to authenticated
  with check (public.is_admin());

create policy "moderators_update_admin"
  on public.moderators for update
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

create policy "moderators_delete_admin"
  on public.moderators for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.3 modules (course catalog)
-- ----------------------------------------------------------------------------

-- All authenticated users can read modules.
create policy "modules_select_authenticated"
  on public.modules for select
  to authenticated
  using (true);

create policy "modules_insert_admin"
  on public.modules for insert
  to authenticated
  with check (public.is_admin());

create policy "modules_update_admin"
  on public.modules for update
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

create policy "modules_delete_admin"
  on public.modules for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.4 lessons
-- ----------------------------------------------------------------------------

create policy "lessons_select_authenticated"
  on public.lessons for select
  to authenticated
  using (true);

create policy "lessons_insert_admin"
  on public.lessons for insert
  to authenticated
  with check (public.is_admin());

create policy "lessons_update_admin"
  on public.lessons for update
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

create policy "lessons_delete_admin"
  on public.lessons for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.5 lesson_clips
-- ----------------------------------------------------------------------------

create policy "lesson_clips_select_authenticated"
  on public.lesson_clips for select
  to authenticated
  using (true);

create policy "lesson_clips_insert_admin"
  on public.lesson_clips for insert
  to authenticated
  with check (public.is_admin());

create policy "lesson_clips_update_admin"
  on public.lesson_clips for update
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

create policy "lesson_clips_delete_admin"
  on public.lesson_clips for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.6 lesson_resources
-- ----------------------------------------------------------------------------

create policy "lesson_resources_select_authenticated"
  on public.lesson_resources for select
  to authenticated
  using (true);

create policy "lesson_resources_insert_admin"
  on public.lesson_resources for insert
  to authenticated
  with check (public.is_admin());

create policy "lesson_resources_update_admin"
  on public.lesson_resources for update
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

create policy "lesson_resources_delete_admin"
  on public.lesson_resources for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.7 module_access
-- ----------------------------------------------------------------------------

-- Users can see their own grants; admin can see all.
create policy "module_access_select"
  on public.module_access for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only admin manages access grants.
create policy "module_access_insert_admin"
  on public.module_access for insert
  to authenticated
  with check (public.is_admin());

create policy "module_access_delete_admin"
  on public.module_access for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.8 lesson_progress
-- ----------------------------------------------------------------------------

create policy "lesson_progress_select"
  on public.lesson_progress for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "lesson_progress_insert_own"
  on public.lesson_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "lesson_progress_update_own"
  on public.lesson_progress for update
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "lesson_progress_delete_own"
  on public.lesson_progress for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8.9 homework
-- ----------------------------------------------------------------------------

create policy "homework_select"
  on public.homework for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "homework_insert_own"
  on public.homework for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "homework_update_own"
  on public.homework for update
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "homework_delete_own"
  on public.homework for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8.10 video_progress
-- ----------------------------------------------------------------------------

create policy "video_progress_select"
  on public.video_progress for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "video_progress_insert_own"
  on public.video_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "video_progress_update_own"
  on public.video_progress for update
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "video_progress_delete_own"
  on public.video_progress for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8.11 posts
-- ----------------------------------------------------------------------------

-- Visible if: approved, OR author is viewer, OR viewer is admin/mod-approve.
create policy "posts_select"
  on public.posts for select
  to authenticated
  using (
    status = 'approved'
    or author_id = auth.uid()
    or public.is_admin()
    or public.is_mod_with('can_approve_posts')
  );

-- Any non-paused authenticated user can create a post for themselves.
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'paused'
    )
  );

-- Status fields (approve/reject) can only be changed by admin or mods with
-- can_approve_posts. Uses a permissive UPDATE covering those actors.
create policy "posts_update_status_mod"
  on public.posts for update
  to authenticated
  using  (public.is_mod_with('can_approve_posts'))
  with check (public.is_mod_with('can_approve_posts'));

-- Pin/unpin requires can_pin_content permission.
create policy "posts_update_pin_mod"
  on public.posts for update
  to authenticated
  using  (public.is_mod_with('can_pin_content'))
  with check (public.is_mod_with('can_pin_content'));

-- Post author can delete their own post.
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid());

-- Admin and mods with can_delete_posts can delete any post.
create policy "posts_delete_mod"
  on public.posts for delete
  to authenticated
  using (public.is_mod_with('can_delete_posts'));

-- ----------------------------------------------------------------------------
-- 8.12 comments
-- ----------------------------------------------------------------------------

-- A comment is readable when its parent post is readable by the viewer.
create policy "comments_select"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (
          p.status = 'approved'
          or p.author_id = auth.uid()
          or public.is_admin()
          or public.is_mod_with('can_approve_posts')
        )
    )
  );

-- Non-paused users can comment on approved posts.
create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'paused'
    )
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'approved'
    )
  );

-- Pin/unpin by can_pin_content or admin.
create policy "comments_update_pin_mod"
  on public.comments for update
  to authenticated
  using  (public.is_mod_with('can_pin_content'))
  with check (public.is_mod_with('can_pin_content'));

-- Author can delete their own comment.
create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (author_id = auth.uid());

-- Mods with can_delete_comments can delete any comment.
create policy "comments_delete_mod"
  on public.comments for delete
  to authenticated
  using (public.is_mod_with('can_delete_comments'));

-- ----------------------------------------------------------------------------
-- 8.13 post_likes
-- ----------------------------------------------------------------------------

create policy "post_likes_select_authenticated"
  on public.post_likes for select
  to authenticated
  using (true);

-- Non-paused user can like (own row only).
create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'paused'
    )
  );

-- Can only unlike own like.
create policy "post_likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8.14 follows
-- ----------------------------------------------------------------------------

create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8.15 notifications
-- ----------------------------------------------------------------------------

-- Only the recipient can read their notifications.
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

-- Allow authenticated users to INSERT notifications so client-side actions
-- (like, comment, follow) can fan-out in real time without an Edge Function.
-- Service role (Edge Functions) also bypasses RLS and can insert freely.
create policy "notifications_insert_authenticated"
  on public.notifications for insert
  to authenticated
  with check (true);

-- Recipient can mark their own notifications read (UPDATE).
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using  (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Recipient can delete their own notifications.
create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (recipient_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8.16 community_settings
-- ----------------------------------------------------------------------------

create policy "community_settings_select_authenticated"
  on public.community_settings for select
  to authenticated
  using (true);

-- Admin or mods with can_manage_approval can update.
create policy "community_settings_update_mod"
  on public.community_settings for update
  to authenticated
  using  (public.is_mod_with('can_manage_approval'))
  with check (public.is_mod_with('can_manage_approval'));

-- ----------------------------------------------------------------------------
-- 8.17 post_reports
-- ----------------------------------------------------------------------------

-- Any authenticated user can file a report.
create policy "post_reports_insert_own"
  on public.post_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Only admin and mods can read or update reports.
create policy "post_reports_select_mod"
  on public.post_reports for select
  to authenticated
  using (public.is_mod_with('can_approve_posts'));

create policy "post_reports_update_mod"
  on public.post_reports for update
  to authenticated
  using  (public.is_mod_with('can_approve_posts'))
  with check (public.is_mod_with('can_approve_posts'));

-- ----------------------------------------------------------------------------
-- 8.18 moderation_log
-- ----------------------------------------------------------------------------

-- Admin and mods can write audit entries.
create policy "moderation_log_insert_mod"
  on public.moderation_log for insert
  to authenticated
  with check (public.is_mod_with('can_approve_posts'));

-- Only admin can read the full audit log.
create policy "moderation_log_select_admin"
  on public.moderation_log for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8.19 invites
-- ----------------------------------------------------------------------------

-- Only admin can manage invites.
create policy "invites_all_admin"
  on public.invites for all
  to authenticated
  using  (public.is_admin())
  with check (public.is_admin());


-- =============================================================================
-- 9. STORAGE
-- Execute after enabling the Storage extension in your Supabase project.
-- =============================================================================

-- Buckets
insert into storage.buckets (id, name, public)
values
  ('avatars',     'avatars',     true),
  ('post-media',  'post-media',  true),
  ('lesson-videos', 'lesson-videos', false)
on conflict (id) do nothing;

-- ---- Storage policies ----

-- avatars: public read
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- avatars: authenticated user can upload/replace only inside their own uid folder
-- Expected path: avatars/<user_uuid>/<filename>
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- post-media: public read
create policy "post_media_select_public"
  on storage.objects for select
  using (bucket_id = 'post-media');

-- post-media: owner uploads to their uid folder
-- Expected path: post-media/<user_uuid>/<filename>
create policy "post_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- lesson-videos: private bucket; only authenticated users can read
create policy "lesson_videos_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'lesson-videos');

-- lesson-videos: only admin can upload (managed via service role or admin UI)
create policy "lesson_videos_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lesson-videos'
    and public.is_admin()
  );

create policy "lesson_videos_delete_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lesson-videos'
    and public.is_admin()
  );
