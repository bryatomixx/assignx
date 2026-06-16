-- =============================================================================
-- AssignX Agency Partners Academy - Academy Demo State
-- Migration: 0003_academy_demo.sql
-- Apply manually via Supabase SQL Editor (privileged role, RLS bypassed).
-- Safe to re-run: every INSERT uses ON CONFLICT DO NOTHING.
--
-- Prerequisites: 0001_initial_schema.sql and 0002_demo_profiles_and_seed.sql
-- must already be applied (profiles table must have the 5 demo rows).
--
-- Purpose: seed lesson_progress, homework, and module_access from the mock
-- data layer (lib/mock/users.ts). The modules/lessons tables are still empty
-- (course seed is deferred), so the FKs from these three tables to
-- lessons.id and modules.id are dropped for now (demo mode). The FK to
-- profiles.id (user_id) is kept intact.
--
-- Rollback note: to restore the three dropped FKs after seeding modules and
-- lessons, run:
--   alter table public.lesson_progress
--     add constraint lesson_progress_lesson_id_fkey
--     foreign key (lesson_id) references public.lessons(id) on delete cascade;
--   alter table public.homework
--     add constraint homework_lesson_id_fkey
--     foreign key (lesson_id) references public.lessons(id) on delete cascade;
--   alter table public.video_progress
--     add constraint video_progress_lesson_id_fkey
--     foreign key (lesson_id) references public.lessons(id) on delete cascade;
--   alter table public.module_access
--     add constraint module_access_module_id_fkey
--     foreign key (module_id) references public.modules(id) on delete cascade;
-- The text ids used below ("orientation", "w1d1", etc.) match the lesson.id
-- and module.id values that will be inserted when the course is seeded, so
-- referential integrity will be self-consistent after that seed runs.
-- =============================================================================


-- =============================================================================
-- UUID / ID REFERENCE (this migration)
-- u-admin    -> 11111111-1111-1111-1111-111111111111
-- u-test     -> 22222222-2222-2222-2222-222222222222  (no progress / no modules)
-- u-jon      -> 33333333-3333-3333-3333-333333333333
-- u-michelle -> 44444444-4444-4444-4444-444444444444
-- u-stevie   -> 55555555-5555-5555-5555-555555555555
--
-- lesson ids (source: lib/mock/modules.ts courseLessons + paidModule slugs):
--   orientation, w1d1, w1d2, w2d1, w2d2, w3d1, w3d2, w4d1, w4d2
--   agency-scaling-l1  (first lesson of mod-scale, slug "agency-scaling")
--
-- module ids (source: lib/mock/modules.ts):
--   mod-30-day, mod-scale, mod-voice, mod-enterprise
-- =============================================================================


-- =============================================================================
-- STEP 1: Drop FK constraints that point to lessons.id and modules.id
-- Postgres auto-generates these names from table + column; the names below
-- match the default pattern "<table>_<column>_fkey".
-- video_progress is included even though it is not seeded here, because its
-- FK blocks any runtime INSERT as long as lessons is empty.
-- =============================================================================

alter table public.lesson_progress
  drop constraint if exists lesson_progress_lesson_id_fkey;

alter table public.homework
  drop constraint if exists homework_lesson_id_fkey;

alter table public.video_progress
  drop constraint if exists video_progress_lesson_id_fkey;

alter table public.module_access
  drop constraint if exists module_access_module_id_fkey;


-- =============================================================================
-- STEP 2: Seed lesson_progress
-- Source: lib/mock/users.ts (SEED_PROGRESS)
-- Users with empty completedLessonIds (u-admin, u-test) produce no rows.
-- completed_at is a deterministic ISO literal derived from each user's
-- joinedAt so repeated runs stay idempotent and auditable.
-- Row count: 12
--   u-jon      -> 3 rows  (orientation, w1d1, w1d2)
--   u-michelle -> 8 rows  (orientation, w1d1, w1d2, w2d1, w2d2, w3d1, w3d2,
--                           agency-scaling-l1)
--   u-stevie   -> 1 row   (orientation)
-- =============================================================================

insert into public.lesson_progress (user_id, lesson_id, completed_at)
values
  -- u-jon (joined 2026-05-02)
  ('33333333-3333-3333-3333-333333333333', 'orientation',      '2026-05-02T10:00:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', 'w1d1',             '2026-05-09T10:00:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', 'w1d2',             '2026-05-09T11:00:00.000Z'),

  -- u-michelle (joined 2026-04-18)
  ('44444444-4444-4444-4444-444444444444', 'orientation',      '2026-04-18T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w1d1',             '2026-04-25T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w1d2',             '2026-04-25T11:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w2d1',             '2026-05-02T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w2d2',             '2026-05-02T11:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w3d1',             '2026-05-09T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w3d2',             '2026-05-09T11:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'agency-scaling-l1','2026-05-16T10:00:00.000Z'),

  -- u-stevie (joined 2026-05-20)
  ('55555555-5555-5555-5555-555555555555', 'orientation',      '2026-05-20T10:00:00.000Z')

on conflict (user_id, lesson_id) do nothing;


-- =============================================================================
-- STEP 3: Seed homework
-- Source: lib/mock/users.ts (SEED_HOMEWORK)
-- Only u-jon and u-michelle have doneLessonIds entries.
-- Row count: 7
--   u-jon      -> 2 rows  (orientation, w1d1)
--   u-michelle -> 5 rows  (orientation, w1d1, w1d2, w2d1, w2d2)
-- done_at anchored one day after the matching completed_at for coherence.
-- =============================================================================

insert into public.homework (user_id, lesson_id, done_at)
values
  -- u-jon
  ('33333333-3333-3333-3333-333333333333', 'orientation', '2026-05-03T10:00:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', 'w1d1',        '2026-05-10T10:00:00.000Z'),

  -- u-michelle
  ('44444444-4444-4444-4444-444444444444', 'orientation', '2026-04-19T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w1d1',        '2026-04-26T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w1d2',        '2026-04-26T11:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w2d1',        '2026-05-03T10:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'w2d2',        '2026-05-03T11:00:00.000Z')

on conflict (user_id, lesson_id) do nothing;


-- =============================================================================
-- STEP 4: Seed module_access
-- Source: lib/mock/users.ts (SEED_USERS[*].unlockedModuleIds)
-- Users with empty unlockedModuleIds (u-test, u-jon, u-stevie) produce no rows.
-- granted_by = u-admin (11111111-...) for all grants.
-- Row count: 4
--   u-admin    -> 3 rows  (mod-scale, mod-voice, mod-enterprise)
--   u-michelle -> 1 row   (mod-scale)
-- =============================================================================

insert into public.module_access (user_id, module_id, granted_by, granted_at)
values
  -- u-admin unlocked modules (self-granted as admin)
  ('11111111-1111-1111-1111-111111111111', 'mod-scale',      '11111111-1111-1111-1111-111111111111', '2026-01-12T10:00:00.000Z'),
  ('11111111-1111-1111-1111-111111111111', 'mod-voice',      '11111111-1111-1111-1111-111111111111', '2026-01-12T10:00:00.000Z'),
  ('11111111-1111-1111-1111-111111111111', 'mod-enterprise',  '11111111-1111-1111-1111-111111111111', '2026-01-12T10:00:00.000Z'),

  -- u-michelle: admin granted mod-scale
  ('44444444-4444-4444-4444-444444444444', 'mod-scale',      '11111111-1111-1111-1111-111111111111', '2026-05-09T10:00:00.000Z')

on conflict (user_id, module_id) do nothing;
