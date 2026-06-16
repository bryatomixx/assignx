-- =============================================================================
-- AssignX Agency Partners Academy - Demo Profiles and Community Seed Data
-- Migration: 0002_demo_profiles_and_seed.sql
-- Apply manually via Supabase SQL Editor (privileged role, RLS bypassed).
-- Safe to re-run: every INSERT uses ON CONFLICT DO NOTHING.
-- =============================================================================

-- =============================================================================
-- UUID MAPPING REFERENCE
-- Mock id    -> UUID
-- u-admin    -> 11111111-1111-1111-1111-111111111111
-- u-test     -> 22222222-2222-2222-2222-222222222222
-- u-jon      -> 33333333-3333-3333-3333-333333333333
-- u-michelle -> 44444444-4444-4444-4444-444444444444
-- u-stevie   -> 55555555-5555-5555-5555-555555555555
--
-- post-1  -> 00000000-0000-0000-0000-000000000001
-- post-2  -> 00000000-0000-0000-0000-000000000002
-- post-3  -> 00000000-0000-0000-0000-000000000003
-- post-4  -> 00000000-0000-0000-0000-000000000004
-- post-5  -> 00000000-0000-0000-0000-000000000005
-- post-6  -> 00000000-0000-0000-0000-000000000006
-- post-7  -> 00000000-0000-0000-0000-000000000007
--
-- comment-1 -> 00000000-0000-0000-0001-000000000001
-- comment-2 -> 00000000-0000-0000-0001-000000000002
-- comment-3 -> 00000000-0000-0000-0001-000000000003
-- comment-4 -> 00000000-0000-0000-0001-000000000004
-- comment-5 -> 00000000-0000-0000-0001-000000000005
-- comment-6 -> 00000000-0000-0000-0001-000000000006
-- comment-7 -> 00000000-0000-0000-0001-000000000007
--
-- notif-1   -> 00000000-0000-0000-0002-000000000001
-- notif-2   -> 00000000-0000-0000-0002-000000000002
-- notif-3   -> 00000000-0000-0000-0002-000000000003
-- =============================================================================


-- =============================================================================
-- STEP 1: Drop the FK that ties profiles.id to auth.users.id
-- This lets us insert demo profiles without real auth.users rows.
-- REVERT WHEN ADDING REAL AUTH:
--   alter table public.profiles
--     add constraint profiles_id_fkey
--     foreign key (id) references auth.users(id) on delete cascade;
-- =============================================================================

alter table public.profiles
  drop constraint if exists profiles_id_fkey;


-- =============================================================================
-- STEP 2: Insert the 5 demo profiles
-- Source: lib/mock/users.ts (SEED_USERS)
-- auto_approve = true only for u-michelle (SEED_COMMUNITY_SETTINGS.autoApproveUserIds)
-- =============================================================================

insert into public.profiles
  (id, name, email, role, status, avatar, auto_approve, joined_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Noah Nega',
    'noah@assignx.ai',
    'admin',
    'active',
    '🧑🏻‍💼',
    false,
    '2026-01-12T00:00:00.000Z'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Test Member',
    'test@partner.io',
    'student',
    'active',
    '🧑🏻‍💻',
    false,
    '2026-06-01T00:00:00.000Z'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Jon S.',
    'jon@partner.io',
    'student',
    'active',
    '🧔🏻',
    false,
    '2026-05-02T00:00:00.000Z'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Michelle N.',
    'michelle@partner.io',
    'student',
    'active',
    '👩🏽‍🦱',
    true,    -- in SEED_COMMUNITY_SETTINGS.autoApproveUserIds
    '2026-04-18T00:00:00.000Z'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Stevie F.',
    'stevie@partner.io',
    'student',
    'paused',
    '👨🏼‍🦰',
    false,
    '2026-05-20T00:00:00.000Z'
  )
on conflict (id) do nothing;


-- =============================================================================
-- STEP 3: Insert Jon (u-jon) as moderator with his exact 5 permissions
-- Source: lib/mock/board.ts (SEED_MODS)
-- =============================================================================

insert into public.moderators
  (user_id, can_approve_posts, can_delete_posts, can_delete_comments,
   can_pin_content, can_manage_approval)
values
  (
    '33333333-3333-3333-3333-333333333333',
    true,   -- canApprovePosts
    false,  -- canDeletePosts
    true,   -- canDeleteComments
    true,   -- canPinContent
    false   -- canManageApproval
  )
on conflict (user_id) do nothing;


-- =============================================================================
-- STEP 4: Upsert the community_settings singleton
-- Source: lib/mock/board.ts (SEED_COMMUNITY_SETTINGS.globalApproval = true)
-- Row id=1 was seeded in 0001 with ON CONFLICT DO NOTHING; this upsert
-- ensures the globalApproval value matches the mock layer exactly.
-- =============================================================================

insert into public.community_settings (id, global_approval)
values (1, true)
on conflict (id) do update
  set global_approval = excluded.global_approval;


-- =============================================================================
-- STEP 5: Insert seed posts
-- Source: lib/mock/board.ts (SEED_POSTS)
-- updated_at is set equal to created_at; the trg_posts_updated_at trigger
-- fires on UPDATE, not INSERT, so the value survives as-is.
-- =============================================================================

insert into public.posts
  (id, author_id, body, media_type, media_payload, status, pinned,
   approved_by, approved_at, rejected_by, rejected_at, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',   -- u-admin
    'Welcome to the AssignX Community Board! Share wins, ask questions, and support each other on the 30-day journey.',
    'link',
    'https://www.assignx.ai',
    'approved',
    true,
    '11111111-1111-1111-1111-111111111111',   -- approvedBy u-admin
    '2026-05-01T09:00:00.000Z',
    null,
    null,
    '2026-05-01T09:00:00.000Z',
    '2026-05-01T09:00:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '44444444-4444-4444-4444-444444444444',   -- u-michelle
    'Just finished Week 1: the whitelabel setup was smoother than I expected. Loving the platform so far!',
    'text',
    null,
    'approved',
    false,
    '11111111-1111-1111-1111-111111111111',   -- approvedBy u-admin
    '2026-05-10T14:22:00.000Z',
    null,
    null,
    '2026-05-10T14:22:00.000Z',
    '2026-05-10T14:22:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',   -- u-jon
    'Had my first agency prospecting call today using the AI agent. It booked two appointments on its own. Screenshot below.',
    'image',
    null,
    'approved',
    false,
    '11111111-1111-1111-1111-111111111111',   -- approvedBy u-admin
    '2026-05-15T10:45:00.000Z',
    null,
    null,
    '2026-05-15T10:45:00.000Z',
    '2026-05-15T10:45:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',   -- u-test
    'Does anyone have experience connecting Twilio to a GHL sub-account? My A2P approval is taking forever.',
    'text',
    null,
    'approved',
    false,
    '11111111-1111-1111-1111-111111111111',   -- approvedBy u-admin
    '2026-05-20T08:35:00.000Z',
    null,
    null,
    '2026-05-20T08:30:00.000Z',
    '2026-05-20T08:30:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '55555555-5555-5555-5555-555555555555',   -- u-stevie
    'Hey everyone! Just joined. Excited to start the challenge. Any tips for someone just getting into the agency space?',
    'text',
    null,
    'pending',                                -- keeps the moderation queue non-empty
    false,
    null,
    null,
    null,
    null,
    '2026-06-01T17:05:00.000Z',
    '2026-06-01T17:05:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    '33333333-3333-3333-3333-333333333333',   -- u-jon
    'Week 6 update: just landed my second retainer client using the outreach sequence from Module 4. The AI follow-up cadence is a game changer.',
    'text',
    null,
    'approved',
    false,
    '11111111-1111-1111-1111-111111111111',   -- approvedBy u-admin
    '2026-06-13T11:05:00.000Z',
    null,
    null,
    '2026-06-13T11:00:00.000Z',
    '2026-06-13T11:00:00.000Z'
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    '44444444-4444-4444-4444-444444444444',   -- u-michelle
    'Sharing my onboarding checklist for new GHL sub-accounts. Cut my setup time in half. Happy to answer questions!',
    'link',
    'https://docs.google.com/spreadsheets/d/example',
    'approved',
    false,
    '11111111-1111-1111-1111-111111111111',   -- approvedBy u-admin
    '2026-06-14T09:32:00.000Z',
    null,
    null,
    '2026-06-14T09:30:00.000Z',
    '2026-06-14T09:30:00.000Z'
  )
on conflict (id) do nothing;


-- =============================================================================
-- STEP 6: Insert seed comments
-- Source: lib/mock/board.ts (SEED_COMMENTS)
-- =============================================================================

insert into public.comments
  (id, post_id, author_id, body, pinned, created_at)
values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000002',   -- post-2
    '11111111-1111-1111-1111-111111111111',   -- u-admin
    'Great to hear, Michelle! Keep that momentum going into Week 2.',
    true,
    '2026-05-10T15:00:00.000Z'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000002',   -- post-2
    '33333333-3333-3333-3333-333333333333',   -- u-jon
    'Same experience here. The domain config tutorial in the resource hub was a lifesaver.',
    false,
    '2026-05-10T16:10:00.000Z'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000003',   -- post-3
    '44444444-4444-4444-4444-444444444444',   -- u-michelle
    'This is amazing, Jon! Which niche are you targeting?',
    false,
    '2026-05-15T11:30:00.000Z'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000004',   -- post-4
    '33333333-3333-3333-3333-333333333333',   -- u-jon
    'A2P took about 5 business days for me. Make sure your Trust Hub business profile is 100% complete before submitting.',
    false,
    '2026-05-20T09:45:00.000Z'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000006',   -- post-6
    '44444444-4444-4444-4444-444444444444',   -- u-michelle
    'Congrats Jon! Which outreach channel converted best for you - email or SMS?',
    false,
    '2026-06-13T12:15:00.000Z'
  ),
  (
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0000-000000000006',   -- post-6
    '22222222-2222-2222-2222-222222222222',   -- u-test
    'This is inspiring. I am starting Module 4 today after seeing this.',
    false,
    '2026-06-13T13:40:00.000Z'
  ),
  (
    '00000000-0000-0000-0001-000000000007',
    '00000000-0000-0000-0000-000000000007',   -- post-7
    '33333333-3333-3333-3333-333333333333',   -- u-jon
    'Michelle this is gold. Bookmarked. Any chance you cover the A2P registration step in there?',
    false,
    '2026-06-14T10:05:00.000Z'
  )
on conflict (id) do nothing;


-- =============================================================================
-- STEP 7: Insert seed likes (post_likes)
-- Source: lib/mock/board.ts (SEED_LIKES)
-- SEED_LIKES has no created_at; using the post created_at as a coherent anchor.
-- =============================================================================

insert into public.post_likes (user_id, post_id, created_at)
values
  -- likes on post-1 (created 2026-05-01)
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '2026-05-01T09:05:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', '2026-05-01T09:06:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', '2026-05-01T09:07:00.000Z'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', '2026-05-01T09:08:00.000Z'),
  -- likes on post-2 (created 2026-05-10)
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '2026-05-10T14:30:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', '2026-05-10T14:31:00.000Z'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '2026-05-10T14:32:00.000Z'),
  -- likes on post-3 (created 2026-05-15)
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000003', '2026-05-15T10:50:00.000Z'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', '2026-05-15T10:51:00.000Z'),
  -- likes on post-4 (created 2026-05-20)
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000004', '2026-05-20T08:40:00.000Z')
on conflict (user_id, post_id) do nothing;


-- =============================================================================
-- STEP 8: Insert seed follows
-- Source: lib/mock/board.ts (SEED_FOLLOWS)
-- =============================================================================

insert into public.follows (follower_id, followee_id, created_at)
values
  -- u-test follows u-admin and u-michelle
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-06-01T00:00:00.000Z'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '2026-06-01T00:01:00.000Z'),
  -- u-jon follows u-admin and u-michelle
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-05-02T00:00:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '2026-05-02T00:01:00.000Z'),
  -- u-michelle follows u-admin
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2026-04-18T00:00:00.000Z'),
  -- u-stevie follows u-admin, u-michelle, and u-test (notif-3 records this follow)
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '2026-05-20T00:00:00.000Z'),
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '2026-05-20T00:01:00.000Z'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '2026-06-01T18:00:00.000Z')
on conflict (follower_id, followee_id) do nothing;


-- =============================================================================
-- STEP 9: Insert seed notifications
-- Source: lib/mock/board.ts (SEED_NOTIFICATIONS)
-- All three notifications are for u-test (recipient 22222222-...).
-- comment_id is left null (AppNotification type does not include it yet).
-- =============================================================================

insert into public.notifications
  (id, recipient_id, actor_id, type, post_id, comment_id, read, created_at)
values
  (
    '00000000-0000-0000-0002-000000000001',
    '22222222-2222-2222-2222-222222222222',   -- u-test
    '44444444-4444-4444-4444-444444444444',   -- u-michelle
    'like',
    '00000000-0000-0000-0000-000000000004',   -- post-4 (u-test Twilio post)
    null,
    false,
    '2026-05-21T10:00:00.000Z'
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '22222222-2222-2222-2222-222222222222',   -- u-test
    '33333333-3333-3333-3333-333333333333',   -- u-jon
    'comment',
    '00000000-0000-0000-0000-000000000004',   -- post-4 (u-test Twilio post)
    null,
    false,
    '2026-05-20T09:45:00.000Z'
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '22222222-2222-2222-2222-222222222222',   -- u-test
    '55555555-5555-5555-5555-555555555555',   -- u-stevie
    'follow',
    null,                                     -- no post; Stevie followed u-test
    null,
    false,
    '2026-06-01T18:00:00.000Z'
  )
on conflict (id) do nothing;
