import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";
import type {
  Post,
  Comment,
  Like,
  Follow,
  AppNotification,
  ModPermissions,
  PostStatus,
  PostMediaType,
  NotificationType,
} from "@/lib/types";

// Disable caching for this route. Community state changes frequently.
export const dynamic = "force-dynamic";

// ---- DB row types (snake_case from Supabase) ----

interface DbPost {
  id: string;
  author_id: string;
  body: string;
  media_type: PostMediaType;
  media_payload: string | null;
  status: PostStatus;
  pinned: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  created_at: string;
}

interface DbComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

interface DbLike {
  user_id: string;
  post_id: string;
}

interface DbFollow {
  follower_id: string;
  followee_id: string;
}

interface DbNotification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  read: boolean;
  created_at: string;
}

interface DbModerator {
  user_id: string;
  can_approve_posts: boolean;
  can_delete_posts: boolean;
  can_delete_comments: boolean;
  can_pin_content: boolean;
  can_manage_approval: boolean;
}

interface DbProfile {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar: string;
  auto_approve: boolean;
}

interface DbCommunitySettings {
  global_approval: boolean;
}

// ---- Mappers: DB row -> app type ----

function mapPost(r: DbPost): Post {
  return {
    id: r.id,
    authorId: r.author_id,
    body: r.body,
    mediaType: r.media_type,
    mediaPayload: r.media_payload,
    status: r.status,
    pinned: r.pinned,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    rejectedBy: r.rejected_by,
    rejectedAt: r.rejected_at,
    createdAt: r.created_at,
  };
}

function mapComment(r: DbComment): Comment {
  return {
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    body: r.body,
    pinned: r.pinned,
    createdAt: r.created_at,
  };
}

function mapLike(r: DbLike): Like {
  return { userId: r.user_id, postId: r.post_id };
}

function mapFollow(r: DbFollow): Follow {
  return { followerId: r.follower_id, followeeId: r.followee_id };
}

function mapNotification(r: DbNotification): AppNotification {
  return {
    id: r.id,
    recipientId: r.recipient_id,
    actorId: r.actor_id,
    type: r.type,
    postId: r.post_id,
    createdAt: r.created_at,
    read: r.read,
  };
}

function mapMod(r: DbModerator): ModPermissions {
  return {
    canApprovePosts: r.can_approve_posts,
    canDeletePosts: r.can_delete_posts,
    canDeleteComments: r.can_delete_comments,
    canPinContent: r.can_pin_content,
    canManageApproval: r.can_manage_approval,
  };
}

// ---- Route handler ----

export async function GET(): Promise<Response> {
  // Require authenticated session before returning any community state.
  let sessionUserId: string;
  try {
    const sessionClient = await createServerSupabase();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    sessionUserId = user.id;
  } catch {
    return Response.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  try {
    const db = createAdminClient();

    const [
      postsRes,
      commentsRes,
      likesRes,
      followsRes,
      notificationsRes,
      settingsRes,
      modsRes,
      profilesRes,
    ] = await Promise.all([
      db.from("posts").select("*").order("created_at", { ascending: false }),
      db.from("comments").select("*").order("created_at", { ascending: true }),
      db.from("post_likes").select("user_id, post_id"),
      db.from("follows").select("follower_id, followee_id"),
      // Only the recipient's own notifications, never everyone's.
      db
        .from("notifications")
        .select("*")
        .eq("recipient_id", sessionUserId)
        .order("created_at", { ascending: false }),
      db.from("community_settings").select("global_approval").eq("id", 1).single(),
      db.from("moderators").select("*"),
      db.from("profiles").select("id, name, role, status, avatar, auto_approve"),
    ]);

    if (postsRes.error) throw postsRes.error;
    if (commentsRes.error) throw commentsRes.error;
    if (likesRes.error) throw likesRes.error;
    if (followsRes.error) throw followsRes.error;
    if (notificationsRes.error) throw notificationsRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (modsRes.error) throw modsRes.error;
    if (profilesRes.error) throw profilesRes.error;

    const posts = (postsRes.data as DbPost[]).map(mapPost);
    const comments = (commentsRes.data as DbComment[]).map(mapComment);
    const likes = (likesRes.data as DbLike[]).map(mapLike);
    const follows = (followsRes.data as DbFollow[]).map(mapFollow);
    const notifications = (notificationsRes.data as DbNotification[]).map(mapNotification);

    const settings = {
      globalApproval: (settingsRes.data as DbCommunitySettings).global_approval,
    };

    // Build mods as Record<userId, ModPermissions>
    const mods: Record<string, ModPermissions> = {};
    for (const row of modsRes.data as DbModerator[]) {
      mods[row.user_id] = mapMod(row);
    }

    // Profiles with only community-relevant fields
    const profiles = (profilesRes.data as DbProfile[]).map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role as "admin" | "student",
      status: p.status as "active" | "paused",
      avatar: p.avatar,
      autoApprove: p.auto_approve,
    }));

    return Response.json({
      posts,
      comments,
      likes,
      follows,
      notifications,
      settings,
      mods,
      profiles,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
