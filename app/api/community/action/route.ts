import { createAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModPermissions, PostMediaType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

const MAX_MEDIA_PAYLOAD_LENGTH = 2048;

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Disable caching -- this route mutates state.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionBody {
  action: string;
  // userId travels from the client. Trusted only in demo mode (no real auth).
  // SECURITY NOTE: in production this must be replaced by reading the session
  // from the auth cookie. Never trust the client for identity in a real app.
  userId: string;
  payload?: Record<string, unknown>;
}

interface ActorContext {
  userId: string;
  role: "admin" | "student";
  status: "active" | "paused";
  autoApprove: boolean;
  modPerms: ModPermissions | null;
}

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

function isAdmin(ctx: ActorContext): boolean {
  return ctx.role === "admin";
}

function isMod(ctx: ActorContext): boolean {
  return ctx.modPerms !== null;
}

function canApprovePosts(ctx: ActorContext): boolean {
  if (isAdmin(ctx)) return true;
  if (isMod(ctx)) return ctx.modPerms!.canApprovePosts;
  return false;
}

function canDeletePosts(ctx: ActorContext): boolean {
  if (isAdmin(ctx)) return true;
  if (isMod(ctx)) return ctx.modPerms!.canDeletePosts;
  return false;
}

function canDeleteComments(ctx: ActorContext): boolean {
  if (isAdmin(ctx)) return true;
  if (isMod(ctx)) return ctx.modPerms!.canDeleteComments;
  return false;
}

function canPinContent(ctx: ActorContext): boolean {
  if (isAdmin(ctx)) return true;
  if (isMod(ctx)) return ctx.modPerms!.canPinContent;
  return false;
}

function canManageApproval(ctx: ActorContext): boolean {
  if (isAdmin(ctx)) return true;
  if (isMod(ctx)) return ctx.modPerms!.canManageApproval;
  return false;
}

// ---------------------------------------------------------------------------
// Actor context loader
// ---------------------------------------------------------------------------

async function loadActor(
  db: SupabaseClient,
  userId: string,
): Promise<ActorContext | null> {
  const profileRes = await db
    .from("profiles")
    .select("id, role, status, auto_approve")
    .eq("id", userId)
    .single();
  if (profileRes.error || !profileRes.data) return null;

  const modRes = await db
    .from("moderators")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let modPerms: ModPermissions | null = null;
  if (modRes.data) {
    modPerms = {
      canApprovePosts: modRes.data.can_approve_posts,
      canDeletePosts: modRes.data.can_delete_posts,
      canDeleteComments: modRes.data.can_delete_comments,
      canPinContent: modRes.data.can_pin_content,
      canManageApproval: modRes.data.can_manage_approval,
    };
  }

  return {
    userId,
    role: profileRes.data.role as "admin" | "student",
    status: profileRes.data.status as "active" | "paused",
    autoApprove: profileRes.data.auto_approve as boolean,
    modPerms,
  };
}

// ---------------------------------------------------------------------------
// Notification helper
// ---------------------------------------------------------------------------

async function pushNotification(
  db: SupabaseClient,
  recipientId: string,
  actorId: string,
  type: string,
  postId: string | null,
): Promise<void> {
  // Never notify when recipient is the actor.
  if (recipientId === actorId) return;
  await db.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    post_id: postId,
  });
}

// ---------------------------------------------------------------------------
// Status resolver
// ---------------------------------------------------------------------------

async function resolveInitialStatus(
  db: SupabaseClient,
  ctx: ActorContext,
): Promise<"approved" | "pending"> {
  // Author-level fast path: admins, mods, and auto-approved users bypass global.
  if (isAdmin(ctx) || isMod(ctx)) return "approved";
  if (ctx.autoApprove) return "approved";

  // Fetch the global approval setting. An error from the DB is NOT a safe
  // default -- fail toward "pending" so we never auto-approve on DB failure.
  const settingsRes = await db
    .from("community_settings")
    .select("global_approval")
    .eq("id", 1)
    .single();

  if (settingsRes.error) {
    // Log the error and treat as pending (fail-closed, not fail-open).
    console.error("[resolveInitialStatus] community_settings query failed:", settingsRes.error.message);
    return "pending";
  }

  // global_approval === false means the owner disabled mandatory review.
  if (settingsRes.data.global_approval === false) return "approved";

  return "pending";
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function ok(): Response {
  return Response.json({ ok: true });
}

function err(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleCreatePost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (ctx.status === "paused") return err("User is paused", 403);

  const body = typeof payload.body === "string" ? payload.body.slice(0, 2000) : "";
  if (!body.trim()) return err("Post body is required");

  const mediaType = (payload.mediaType ?? "text") as PostMediaType;
  const mediaPayload: string | null =
    typeof payload.mediaPayload === "string" ? payload.mediaPayload : null;

  if (mediaPayload !== null) {
    if (mediaPayload.length > MAX_MEDIA_PAYLOAD_LENGTH) {
      return err("mediaPayload exceeds maximum length", 400);
    }
    if (mediaType === "link" && !isSafeUrl(mediaPayload)) {
      return err("mediaPayload must be a valid http/https URL", 400);
    }
  }

  const status = await resolveInitialStatus(db, ctx);
  const now = new Date().toISOString();

  const insertRes = await db
    .from("posts")
    .insert({
      author_id: ctx.userId,
      body,
      media_type: mediaType,
      media_payload: mediaPayload,
      status,
      pinned: false,
      approved_by: status === "approved" ? ctx.userId : null,
      approved_at: status === "approved" ? now : null,
    })
    .select("id, author_id")
    .single();

  if (insertRes.error) throw insertRes.error;
  const postId: string = insertRes.data.id;

  if (status === "pending") {
    // Notify all users who can approve posts (admin + mods with canApprovePosts).
    const adminRes = await db
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    const modRes = await db
      .from("moderators")
      .select("user_id")
      .eq("can_approve_posts", true);

    const approverIds = new Set<string>();
    if (!adminRes.error && adminRes.data) {
      for (const row of adminRes.data) approverIds.add(row.id as string);
    }
    if (!modRes.error && modRes.data) {
      for (const row of modRes.data) approverIds.add(row.user_id as string);
    }
    approverIds.delete(ctx.userId);

    for (const recipientId of approverIds) {
      await pushNotification(db, recipientId, ctx.userId, "post_pending", postId);
    }
  }

  return ok();
}

async function handleApprovePost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!canApprovePosts(ctx)) return err("Insufficient permission", 403);
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const postRes = await db
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();
  if (postRes.error || !postRes.data) return err("Post not found", 404);

  const now = new Date().toISOString();
  const updateRes = await db
    .from("posts")
    .update({
      status: "approved",
      approved_by: ctx.userId,
      approved_at: now,
      rejected_by: null,
      rejected_at: null,
    })
    .eq("id", postId);
  if (updateRes.error) throw updateRes.error;

  await pushNotification(
    db,
    postRes.data.author_id as string,
    ctx.userId,
    "post_approved",
    postId,
  );
  return ok();
}

async function handleRejectPost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!canApprovePosts(ctx)) return err("Insufficient permission", 403);
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const postRes = await db
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();
  if (postRes.error || !postRes.data) return err("Post not found", 404);

  const now = new Date().toISOString();
  const updateRes = await db
    .from("posts")
    .update({
      status: "rejected",
      rejected_by: ctx.userId,
      rejected_at: now,
      approved_by: null,
      approved_at: null,
    })
    .eq("id", postId);
  if (updateRes.error) throw updateRes.error;

  await pushNotification(
    db,
    postRes.data.author_id as string,
    ctx.userId,
    "post_rejected",
    postId,
  );
  return ok();
}

async function handleDeletePost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const postRes = await db
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();
  if (postRes.error || !postRes.data) return err("Post not found", 404);

  const isOwner = postRes.data.author_id === ctx.userId;
  if (!isOwner && !canDeletePosts(ctx)) {
    return err("Insufficient permission", 403);
  }

  // Cascade: delete comments and likes on this post first (FK on_delete cascade handles it
  // in the DB, but explicit deletes ensure cleanliness regardless of DB cascade config).
  await db.from("comments").delete().eq("post_id", postId);
  await db.from("post_likes").delete().eq("post_id", postId);
  await db.from("notifications").delete().eq("post_id", postId);

  const deleteRes = await db.from("posts").delete().eq("id", postId);
  if (deleteRes.error) throw deleteRes.error;

  return ok();
}

async function handlePinPost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
  pinned: boolean,
): Promise<Response> {
  if (!canPinContent(ctx)) return err("Insufficient permission", 403);
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const postRes = await db
    .from("posts")
    .select("id")
    .eq("id", postId)
    .single();
  if (postRes.error || !postRes.data) return err("Post not found", 404);

  const updateRes = await db
    .from("posts")
    .update({ pinned })
    .eq("id", postId);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handleLikePost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (ctx.status === "paused") return err("User is paused", 403);
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const postRes = await db
    .from("posts")
    .select("id, author_id, status")
    .eq("id", postId)
    .single();
  if (postRes.error || !postRes.data) return err("Post not found", 404);
  if (postRes.data.status !== "approved") {
    return err("Cannot like a non-approved post", 403);
  }

  // Idempotent insert: ignore conflict on (user_id, post_id) PK.
  const insertRes = await db
    .from("post_likes")
    .insert({ user_id: ctx.userId, post_id: postId })
    .select()
    .maybeSingle();

  // If already liked (conflict), error code is 23505 -- treat as no-op.
  if (insertRes.error && insertRes.error.code !== "23505") {
    throw insertRes.error;
  }

  // Dedupe: do not create a notification if an unread 'like' from this actor
  // for this post already exists.
  const dedupeRes = await db
    .from("notifications")
    .select("id")
    .eq("type", "like")
    .eq("actor_id", ctx.userId)
    .eq("post_id", postId)
    .eq("read", false)
    .limit(1);

  const alreadyNotified = !dedupeRes.error && dedupeRes.data.length > 0;

  if (!alreadyNotified) {
    await pushNotification(
      db,
      postRes.data.author_id as string,
      ctx.userId,
      "like",
      postId,
    );
  }

  return ok();
}

async function handleUnlikePost(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const deleteRes = await db
    .from("post_likes")
    .delete()
    .eq("user_id", ctx.userId)
    .eq("post_id", postId);
  if (deleteRes.error) throw deleteRes.error;

  return ok();
}

async function handleAddComment(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (ctx.status === "paused") return err("User is paused", 403);
  const postId = payload.postId as string;
  if (!postId) return err("postId is required");

  const rawBody = typeof payload.body === "string" ? payload.body.slice(0, 500) : "";
  if (!rawBody.trim()) return err("Comment body is required");

  const postRes = await db
    .from("posts")
    .select("id, author_id, status")
    .eq("id", postId)
    .single();
  if (postRes.error || !postRes.data) return err("Post not found", 404);
  if (postRes.data.status !== "approved") {
    return err("Cannot comment on a non-approved post", 403);
  }

  const insertRes = await db
    .from("comments")
    .insert({
      post_id: postId,
      author_id: ctx.userId,
      body: rawBody,
      pinned: false,
    });
  if (insertRes.error) throw insertRes.error;

  await pushNotification(
    db,
    postRes.data.author_id as string,
    ctx.userId,
    "comment",
    postId,
  );
  return ok();
}

async function handleDeleteComment(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  const commentId = payload.commentId as string;
  if (!commentId) return err("commentId is required");

  const commentRes = await db
    .from("comments")
    .select("id, author_id")
    .eq("id", commentId)
    .single();
  if (commentRes.error || !commentRes.data) return err("Comment not found", 404);

  const isOwner = commentRes.data.author_id === ctx.userId;
  if (!isOwner && !canDeleteComments(ctx)) {
    return err("Insufficient permission", 403);
  }

  const deleteRes = await db.from("comments").delete().eq("id", commentId);
  if (deleteRes.error) throw deleteRes.error;

  return ok();
}

async function handlePinComment(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
  pinned: boolean,
): Promise<Response> {
  if (!canPinContent(ctx)) return err("Insufficient permission", 403);
  const commentId = payload.commentId as string;
  if (!commentId) return err("commentId is required");

  const commentRes = await db
    .from("comments")
    .select("id")
    .eq("id", commentId)
    .single();
  if (commentRes.error || !commentRes.data) return err("Comment not found", 404);

  const updateRes = await db
    .from("comments")
    .update({ pinned })
    .eq("id", commentId);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handleFollow(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  const targetId = payload.targetId as string;
  if (!targetId) return err("targetId is required");
  if (targetId === ctx.userId) return err("Cannot follow yourself", 400);

  // Idempotent insert.
  const insertRes = await db
    .from("follows")
    .insert({ follower_id: ctx.userId, followee_id: targetId })
    .select()
    .maybeSingle();

  if (insertRes.error && insertRes.error.code !== "23505") {
    throw insertRes.error;
  }

  // Only notify if this is a new follow (not a duplicate).
  if (!insertRes.error) {
    await pushNotification(db, targetId, ctx.userId, "follow", null);
  }

  return ok();
}

async function handleUnfollow(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  const targetId = payload.targetId as string;
  if (!targetId) return err("targetId is required");

  const deleteRes = await db
    .from("follows")
    .delete()
    .eq("follower_id", ctx.userId)
    .eq("followee_id", targetId);
  if (deleteRes.error) throw deleteRes.error;

  return ok();
}

async function handleSetGlobalApproval(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!canManageApproval(ctx)) return err("Insufficient permission", 403);
  if (typeof payload.value !== "boolean") return err("value must be a boolean");

  const updateRes = await db
    .from("community_settings")
    .update({ global_approval: payload.value })
    .eq("id", 1);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handleSetAutoApprove(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!canManageApproval(ctx)) return err("Insufficient permission", 403);
  const targetUserId = payload.targetUserId as string;
  if (!targetUserId) return err("targetUserId is required");
  if (typeof payload.enabled !== "boolean") return err("enabled must be a boolean");

  const updateRes = await db
    .from("profiles")
    .update({ auto_approve: payload.enabled })
    .eq("id", targetUserId);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handlePromoteMod(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!isAdmin(ctx)) return err("Only admin can promote moderators", 403);
  const targetUserId = payload.targetUserId as string;
  if (!targetUserId) return err("targetUserId is required");

  const insertRes = await db.from("moderators").upsert({
    user_id: targetUserId,
    can_approve_posts: false,
    can_delete_posts: false,
    can_delete_comments: false,
    can_pin_content: false,
    can_manage_approval: false,
  });
  if (insertRes.error) throw insertRes.error;

  return ok();
}

async function handleDemoteMod(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!isAdmin(ctx)) return err("Only admin can demote moderators", 403);
  const targetUserId = payload.targetUserId as string;
  if (!targetUserId) return err("targetUserId is required");

  const deleteRes = await db
    .from("moderators")
    .delete()
    .eq("user_id", targetUserId);
  if (deleteRes.error) throw deleteRes.error;

  return ok();
}

async function handleSetModPermission(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!isAdmin(ctx)) return err("Only admin can set mod permissions", 403);
  const targetUserId = payload.targetUserId as string;
  const key = payload.key as string;
  if (!targetUserId) return err("targetUserId is required");
  if (!key) return err("key is required");
  if (typeof payload.value !== "boolean") return err("value must be a boolean");

  // Map camelCase key to DB column name.
  const columnMap: Record<string, string> = {
    canApprovePosts: "can_approve_posts",
    canDeletePosts: "can_delete_posts",
    canDeleteComments: "can_delete_comments",
    canPinContent: "can_pin_content",
    canManageApproval: "can_manage_approval",
  };

  const column = columnMap[key];
  if (!column) return err(`Unknown permission key: ${key}`);

  const updateRes = await db
    .from("moderators")
    .update({ [column]: payload.value })
    .eq("user_id", targetUserId);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handleMarkNotificationRead(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  const id = payload.id as string;
  if (!id) return err("id is required");

  // Only update if the notification belongs to this user.
  const updateRes = await db
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("recipient_id", ctx.userId);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handleMarkAllNotificationsRead(
  db: SupabaseClient,
  ctx: ActorContext,
): Promise<Response> {
  const updateRes = await db
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", ctx.userId)
    .eq("read", false);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handlePurgeUser(
  db: SupabaseClient,
  ctx: ActorContext,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!isAdmin(ctx)) return err("Only admin can purge users", 403);
  const targetUserId = payload.targetUserId as string;
  if (!targetUserId) return err("targetUserId is required");

  // Fetch all post IDs authored by the target so we can cascade manually.
  const postsRes = await db
    .from("posts")
    .select("id")
    .eq("author_id", targetUserId);
  if (postsRes.error) throw postsRes.error;
  const postIds = (postsRes.data as { id: string }[]).map((r) => r.id);

  // Delete notifications where this user is recipient or actor.
  await db
    .from("notifications")
    .delete()
    .or(`recipient_id.eq.${targetUserId},actor_id.eq.${targetUserId}`);

  // Delete follows in both directions.
  await db
    .from("follows")
    .delete()
    .or(`follower_id.eq.${targetUserId},followee_id.eq.${targetUserId}`);

  // Delete likes given by the user AND likes on the user's posts.
  if (postIds.length > 0) {
    await db.from("post_likes").delete().in("post_id", postIds);
  }
  await db.from("post_likes").delete().eq("user_id", targetUserId);

  // Delete comments by this user AND comments on the user's posts.
  if (postIds.length > 0) {
    await db.from("comments").delete().in("post_id", postIds);
  }
  await db.from("comments").delete().eq("author_id", targetUserId);

  // Delete the user's posts.
  await db.from("posts").delete().eq("author_id", targetUserId);

  // Remove from moderators if present.
  await db.from("moderators").delete().eq("user_id", targetUserId);

  // Reset auto_approve on the profile. Do NOT delete the profile in demo mode.
  await db
    .from("profiles")
    .update({ auto_approve: false })
    .eq("id", targetUserId);

  return ok();
}

// ---------------------------------------------------------------------------
// POST handler -- dispatcher
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return err("Invalid JSON body");
  }

  const { action, userId, payload = {} } = body;

  if (!action || typeof action !== "string") {
    return err("action is required");
  }
  if (!userId || typeof userId !== "string") {
    return err("userId is required");
  }

  const db = createAdminClient();

  let ctx: ActorContext | null;
  try {
    ctx = await loadActor(db, userId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load actor";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }

  if (!ctx) {
    return err("User profile not found", 404);
  }

  try {
    switch (action) {
      case "createPost":
        return await handleCreatePost(db, ctx, payload);
      case "approvePost":
        return await handleApprovePost(db, ctx, payload);
      case "rejectPost":
        return await handleRejectPost(db, ctx, payload);
      case "deletePost":
        return await handleDeletePost(db, ctx, payload);
      case "pinPost":
        return await handlePinPost(db, ctx, payload, true);
      case "unpinPost":
        return await handlePinPost(db, ctx, payload, false);
      case "likePost":
        return await handleLikePost(db, ctx, payload);
      case "unlikePost":
        return await handleUnlikePost(db, ctx, payload);
      case "addComment":
        return await handleAddComment(db, ctx, payload);
      case "deleteComment":
        return await handleDeleteComment(db, ctx, payload);
      case "pinComment":
        return await handlePinComment(db, ctx, payload, true);
      case "unpinComment":
        return await handlePinComment(db, ctx, payload, false);
      case "follow":
        return await handleFollow(db, ctx, payload);
      case "unfollow":
        return await handleUnfollow(db, ctx, payload);
      case "setGlobalApproval":
        return await handleSetGlobalApproval(db, ctx, payload);
      case "setAutoApprove":
        return await handleSetAutoApprove(db, ctx, payload);
      case "promoteMod":
        return await handlePromoteMod(db, ctx, payload);
      case "demoteMod":
        return await handleDemoteMod(db, ctx, payload);
      case "setModPermission":
        return await handleSetModPermission(db, ctx, payload);
      case "markNotificationRead":
        return await handleMarkNotificationRead(db, ctx, payload);
      case "markAllNotificationsRead":
        return await handleMarkAllNotificationsRead(db, ctx);
      case "purgeUser":
        return await handlePurgeUser(db, ctx, payload);
      default:
        return err(`Unknown action: ${action}`, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
