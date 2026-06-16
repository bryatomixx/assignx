/**
 * lib/academy/api.ts
 *
 * Typed client-side wrappers for the academy API route handlers.
 * Uses fetch only. Never imports server-only modules (lib/supabase/server.ts).
 *
 * CONTRACT CHANGE (real auth):
 *   - userId is NO LONGER sent in the request body for self-scoped actions.
 *     The server derives the actor identity from the session cookie.
 *   - For admin actions that target another user, targetUserId is still sent
 *     in the payload -- but the server ignores any "actorId" from the body
 *     and uses the session uid instead.
 *   - The `userId` parameter is retained in the function signatures only so
 *     that the AcademyProvider call-sites do not need simultaneous changes.
 *     The value is IGNORED by the server. It will be removed in a future cleanup.
 */

import type { Status } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface AcademyProgressRow {
  userId: string;
  lessonId: string;
}

export interface AcademyHomeworkRow {
  userId: string;
  lessonId: string;
}

export interface AcademyVideoProgressRow {
  userId: string;
  lessonId: string;
  clipIndex: number;
  elapsedSec: number;
  durationSec: number;
}

export interface AcademyModuleAccessRow {
  userId: string;
  moduleId: string;
}

export interface AcademyProfileRow {
  id: string;
  name: string;
  // Email is PII: null for other users' profiles unless the viewer is an admin.
  email: string | null;
  role: "admin" | "student";
  status: "active" | "paused";
  avatar: string;
  // ISO date the user joined; null if not set in the DB.
  joinedAt: string | null;
}

export interface AcademyState {
  profiles: AcademyProfileRow[];
  progress: AcademyProgressRow[];
  homework: AcademyHomeworkRow[];
  videoProgress: AcademyVideoProgressRow[];
  moduleAccess: AcademyModuleAccessRow[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Self-scoped action: userId arg is accepted for backward compat but ignored
// server-side (server reads session). Only action + payload are sent.
async function dispatchAction(
  action: string,
  _userId: string,
  payload?: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await fetch("/api/academy/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const data = (await res.json()) as ActionResult;
  return data;
}

// ---------------------------------------------------------------------------
// State fetch
// ---------------------------------------------------------------------------

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

export async function toggleComplete(
  userId: string,
  lessonId: string,
): Promise<ActionResult> {
  return dispatchAction("toggleComplete", userId, { lessonId });
}

export async function markComplete(
  userId: string,
  lessonId: string,
): Promise<ActionResult> {
  return dispatchAction("markComplete", userId, { lessonId });
}

export async function toggleHomework(
  userId: string,
  lessonId: string,
): Promise<ActionResult> {
  return dispatchAction("toggleHomework", userId, { lessonId });
}

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

export async function setStatus(
  userId: string,
  targetUserId: string,
  status: Status,
): Promise<ActionResult> {
  return dispatchAction("setStatus", userId, { targetUserId, status });
}

export async function unlockModule(
  userId: string,
  targetUserId: string,
  moduleId: string,
): Promise<ActionResult> {
  return dispatchAction("unlockModule", userId, { targetUserId, moduleId });
}

export async function lockModule(
  userId: string,
  targetUserId: string,
  moduleId: string,
): Promise<ActionResult> {
  return dispatchAction("lockModule", userId, { targetUserId, moduleId });
}

export async function unlockAll(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("unlockAll", userId, { targetUserId });
}

export async function lockAll(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("lockAll", userId, { targetUserId });
}

export async function removeUser(
  userId: string,
  targetUserId: string,
): Promise<ActionResult> {
  return dispatchAction("removeUser", userId, { targetUserId });
}

export async function setHomeworkDone(
  userId: string,
  targetUserId: string,
  lessonId: string,
  done: boolean,
): Promise<ActionResult> {
  return dispatchAction("setHomeworkDone", userId, { targetUserId, lessonId, done });
}
