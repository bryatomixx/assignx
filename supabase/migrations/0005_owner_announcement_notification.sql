-- 0005_owner_announcement_notification.sql
--
-- Adds the "announcement" value to the notification_type enum. This type is used
-- to broadcast a notification to every member whenever the community owner
-- (Noah) publishes a post. See app/api/community/action/route.ts (handleCreatePost)
-- and lib/community/owner.ts.
--
-- ALTER TYPE ... ADD VALUE only appends a label to the enum; it does not rewrite
-- existing rows and is safe to re-run thanks to IF NOT EXISTS.

alter type public.notification_type add value if not exists 'announcement';
