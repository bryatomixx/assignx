/**
 * lib/academy/api.ts
 *
 * Typed client-side wrappers for the academy API route handlers.
 * Uses fetch only. Never imports server-only modules (lib/supabase/server.ts).
 *
 * In demo mode the caller passes the active user's id without auth. In
 * production this must be replaced by a server-side session; never trust a
 * client-supplied identity in a real app.
 */

import type { Status } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** A single lesson_progress row, camelCase. */
export interface AcademyProgressRow {
  userId: string;
  lessonId: string;
}

/** A single homework row, camelCase. */
export interface AcademyHomeworkRow {
  userId: string;
  lessonId: string;
}

/** A single video_progress row, camelCase. */
export interface AcademyVideoProgressRow {
  userId: string;
  lessonId: string;
  clipIndex: number;
  elapsedSec: number;
  durationSec: number;
}

/** A single module_access row, camelCase. */
export interface AcademyModuleAccessRow {
  userId: string;
  moduleId: string;
}

/** Profile fields returned by GET /api/academy/state. */
export interface AcademyProfileRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  status: "active" | "paused";
  avatar: string;
}

/** Full raw state returned by GET /api/academy/state. */
export interface AcademyState {
  profiles: AcademyProfileRow[];
  progress: AcademyProgressRow[];
  homework: AcademyHomeworkRow[];
  videoProgress: AcademyVideoProgressRow[];
  moduleAccess: AcademyModuleAccessRow[];
}

/** Response shape from POST /api/academy/action. */
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
  const res = await fetch("/api/academy/action", {
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
 * Fetches the full academy state from the server.
 * The client is responsible for computing derived data (progress pcts, access, etc.).
 */
export async function fetchAcademyState(): Promise<AcademyState> {
  const res = await fetch("/api/academy/state", { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to fetch academy state: ${res.status}`);
  }
  return res.json() as Promise<AcademyState>;
}

// ---------------------------------------------------------------------------
// User-scoped progress actions
// ---------------------------------------------------------------------------

/**
 * Toggles completion of a lesson for the acting user.
 * Inserts a lesson_progress row if not present; deletes it if present.
 */
export async function toggleComplete(
  userId: string,
  lessonId: string,
): Promise<ActionResult> {
  return dispatchAction("toggleComplete", userId, { lessonId });
}

/**
 * Marks a lesson as complete for the acting user. Idempotent -- never removes
 * an existing completion row.
 */
export async function markComplete(
  userId: string,
  lessonId: string,
): Promise<ActionResult> {
  return dispatchAction("markComplete", userId, { lessonId });
}

/**
 * Toggles homework completion for a lesson for the acting user.
 */
export async function toggleHomework(
  userId: string,
  lessonId: string,
): Promise<ActionResult> {
  return dispatchAction("toggleHomework", userId, { lessonId });
}

/**
 * Records the furthest video position watched for a clip.
 * The server only advances elapsed_sec -- it never lets it go backwards.
 */
export async function recordVideoProgress(
  userId: string,
  lessonId: string,
  clipIndex: number,
  elapsedSec: number,
  durationSec: number,
): Promise<ActionResult> {
  return dispatchAction("recordVideoProgress", userId, {
    lessonId,
    clipIndex,
    elapsedSec,
    durationSec,
  });
}

// ---------------------------------------------------------------------------
// Admin-only actions
// ---------------------------------------------------------------------------

/**
 * Sets the status (active | paused) of any user. Admin only.
 */
export async function setStatus(
  userId: string,
  targetUserId: string,
  status: Status,
): Promise<ActionResult> {
  return dispatchAction("setStatus", userId, { targetUserId, status });
}

/**
 * Grants access to a single paid module for a target user. Admin only.
 */
export async function unlockModule(
  userId: string,
  targetUserId: string,
  moduleId: string,
): Promise<ActionResult> {
  return dispatchAction("unlockModule", userId, { targetUserId, moduleId });
}

/**
 * Revokes access to a single paid module for a target user. Admin only.
 */
export async function lockModule(
  userId: string,
  targetUserId: string,
  moduleId: string,
): Promise<ActionResult> {
  return dispatchAction("lockModule", userId, { targetUserId, moduleId });
}

/**
 * Grants access to all paid modules for a target user. Admin only.
 */
export async function unlockAll(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("unlockAll", userId, { targetUserId });
}

/**
 * Revokes access to all modules for a target user. Admin only.
 */
export async function lockAll(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("lockAll", userId, { targetUserId });
}

/**
 * Deletes a user's profile. Cascades to all related rows (progress, homework,
 * video_progress, module_access, posts, comments, etc.). Admin only.
 */
export async function removeUser(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("removeUser", userId, { targetUserId });
}

/**
 * Admin override: sets homework done/undone for any user on any lesson.
 */
export async function setHomeworkDone(
  userId: string,
  targetUserId: string,
  lessonId: string,
  done: boolean,
): Promise<ActionResult> {
  return dispatchAction("setHomeworkDone", userId, { targetUserId, lessonId, done });
}
