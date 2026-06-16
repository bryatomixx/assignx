/**
 * lib/community/api.ts
 *
 * Typed client-side wrappers for the community API route handlers.
 * Uses fetch only. Never imports server-only modules (lib/supabase/server.ts).
 * All functions accept userId as the first argument. In demo mode the caller
 * passes the active user's id without auth. In production this must be replaced
 * by a server-side session; never trust a client-supplied identity in real auth.
 */

import type {
  Post,
  Comment,
  Like,
  Follow,
  AppNotification,
  ModPermissions,
  PostMediaType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared types for the API layer
// ---------------------------------------------------------------------------

export interface CommunityProfile {
  id: string;
  name: string;
  role: "admin" | "student";
  status: "active" | "paused";
  avatar: string;
  autoApprove: boolean;
}

export interface CommunitySettings {
  globalApproval: boolean;
}

/** Full raw state returned by GET /api/community/state */
export interface CommunityState {
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  follows: Follow[];
  notifications: AppNotification[];
  settings: CommunitySettings;
  mods: Record<string, ModPermissions>;
  profiles: CommunityProfile[];
}

/** Response shape from POST /api/community/action */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function dispatchAction(
  action: string,
  userId: string,
  payload?: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await fetch("/api/community/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, userId, payload }),
  });
  const data = (await res.json()) as ActionResult;
  return data;
}

// ---------------------------------------------------------------------------
// State fetch
// ---------------------------------------------------------------------------

/**
 * Fetches the full community state from the server.
 * The client is responsible for computing derived data (feed filters, counts, etc.).
 */
export async function fetchCommunityState(): Promise<CommunityState> {
  const res = await fetch("/api/community/state", { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to fetch community state: ${res.status}`);
  }
  return res.json() as Promise<CommunityState>;
}

// ---------------------------------------------------------------------------
// Post actions
// ---------------------------------------------------------------------------

export async function createPost(
  userId: string,
  input: {
    body: string;
    mediaType: PostMediaType;
    mediaPayload: string | null;
  },
): Promise<ActionResult> {
  return dispatchAction("createPost", userId, {
    body: input.body,
    mediaType: input.mediaType,
    mediaPayload: input.mediaPayload,
  });
}

export async function approvePost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("approvePost", userId, { postId });
}

export async function rejectPost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("rejectPost", userId, { postId });
}

export async function deletePost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("deletePost", userId, { postId });
}

export async function pinPost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("pinPost", userId, { postId });
}

export async function unpinPost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("unpinPost", userId, { postId });
}

// ---------------------------------------------------------------------------
// Like actions
// ---------------------------------------------------------------------------

export async function likePost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("likePost", userId, { postId });
}

export async function unlikePost(
  userId: string,
  postId: string,
): Promise<ActionResult> {
  return dispatchAction("unlikePost", userId, { postId });
}

// ---------------------------------------------------------------------------
// Comment actions
// ---------------------------------------------------------------------------

export async function addComment(
  userId: string,
  postId: string,
  body: string,
): Promise<ActionResult> {
  return dispatchAction("addComment", userId, { postId, body });
}

export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<ActionResult> {
  return dispatchAction("deleteComment", userId, { commentId });
}

export async function pinComment(
  userId: string,
  commentId: string,
): Promise<ActionResult> {
  return dispatchAction("pinComment", userId, { commentId });
}

export async function unpinComment(
  userId: string,
  commentId: string,
): Promise<ActionResult> {
  return dispatchAction("unpinComment", userId, { commentId });
}

// ---------------------------------------------------------------------------
// Follow actions
// ---------------------------------------------------------------------------

export async function follow(
  userId: string,
  targetId: string,
): Promise<ActionResult> {
  return dispatchAction("follow", userId, { targetId });
}

export async function unfollow(
  userId: string,
  targetId: string,
): Promise<ActionResult> {
  return dispatchAction("unfollow", userId, { targetId });
}

// ---------------------------------------------------------------------------
// Settings actions (admin or mod with canManageApproval)
// ---------------------------------------------------------------------------

export async function setGlobalApproval(
  userId: string,
  value: boolean,
): Promise<ActionResult> {
  return dispatchAction("setGlobalApproval", userId, { value });
}

export async function setAutoApprove(
  userId: string,
  targetUserId: string,
  enabled: boolean,
): Promise<ActionResult> {
  return dispatchAction("setAutoApprove", userId, { targetUserId, enabled });
}

// ---------------------------------------------------------------------------
// Mod management (admin only)
// ---------------------------------------------------------------------------

export async function promoteMod(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("promoteMod", userId, { targetUserId });
}

export async function demoteMod(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("demoteMod", userId, { targetUserId });
}

export async function setModPermission(
  userId: string,
  targetUserId: string,
  key: keyof ModPermissions,
  value: boolean,
): Promise<ActionResult> {
  return dispatchAction("setModPermission", userId, { targetUserId, key, value });
}

// ---------------------------------------------------------------------------
// Notification actions
// ---------------------------------------------------------------------------

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<ActionResult> {
  return dispatchAction("markNotificationRead", userId, { id });
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<ActionResult> {
  return dispatchAction("markAllNotificationsRead", userId);
}

// ---------------------------------------------------------------------------
// Admin: purge user
// ---------------------------------------------------------------------------

export async function purgeUser(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("purgeUser", userId, { targetUserId });
}
