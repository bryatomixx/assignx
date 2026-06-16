import { createAdminClient } from "@/lib/supabase/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// All paid module IDs. Mirrors the PAID_MODULE_IDS computed from MODULES in
// AcademyProvider. Kept here as a server-side constant so we never import the
// client-side mock (which pulls in Lucide icons and other browser deps).
// ---------------------------------------------------------------------------

const PAID_MODULE_IDS = ["mod-scale", "mod-voice", "mod-enterprise"];

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionBody {
  action: string;
  // userId is NO LONGER trusted from the client. The server derives the actor
  // identity from the authenticated session cookie. Any userId in the body is
  // ignored for identity purposes.
  userId?: string; // kept optional for backward compat; server ignores it
  payload?: Record<string, unknown>;
}

interface ActorProfile {
  id: string;
  role: "admin" | "student";
  status: "active" | "paused";
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
// Actor loader (always from DB, keyed by session uid)
// ---------------------------------------------------------------------------

async function loadActor(
  db: SupabaseClient,
  userId: string,
): Promise<ActorProfile | null> {
  const res = await db
    .from("profiles")
    .select("id, role, status")
    .eq("id", userId)
    .single();
  if (res.error || !res.data) return null;
  return {
    id: userId,
    role: res.data.role as "admin" | "student",
    status: res.data.status as "active" | "paused",
  };
}

// ---------------------------------------------------------------------------
// User-scoped action handlers
// ---------------------------------------------------------------------------

async function handleToggleComplete(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.status === "paused") return err("Account is paused", 403);

  const lessonId = payload.lessonId;
  if (typeof lessonId !== "string" || !lessonId) return err("lessonId is required");

  const existing = await db
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", actor.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data) {
    const del = await db
      .from("lesson_progress")
      .delete()
      .eq("user_id", actor.id)
      .eq("lesson_id", lessonId);
    if (del.error) throw del.error;
  } else {
    const ins = await db
      .from("lesson_progress")
      .insert({ user_id: actor.id, lesson_id: lessonId });
    if (ins.error) throw ins.error;
  }

  return ok();
}

async function handleMarkComplete(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.status === "paused") return err("Account is paused", 403);

  const lessonId = payload.lessonId;
  if (typeof lessonId !== "string" || !lessonId) return err("lessonId is required");

  const ins = await db
    .from("lesson_progress")
    .insert({ user_id: actor.id, lesson_id: lessonId })
    .select()
    .maybeSingle();

  if (ins.error && ins.error.code !== "23505") throw ins.error;

  return ok();
}

async function handleToggleHomework(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.status === "paused") return err("Account is paused", 403);

  const lessonId = payload.lessonId;
  if (typeof lessonId !== "string" || !lessonId) return err("lessonId is required");

  const existing = await db
    .from("homework")
    .select("lesson_id")
    .eq("user_id", actor.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data) {
    const del = await db
      .from("homework")
      .delete()
      .eq("user_id", actor.id)
      .eq("lesson_id", lessonId);
    if (del.error) throw del.error;
  } else {
    const ins = await db
      .from("homework")
      .insert({ user_id: actor.id, lesson_id: lessonId });
    if (ins.error) throw ins.error;
  }

  return ok();
}

async function handleRecordVideoProgress(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.status === "paused") return err("Account is paused", 403);

  const lessonId = payload.lessonId;
  if (typeof lessonId !== "string" || !lessonId) return err("lessonId is required");

  const clipIndex = payload.clipIndex;
  if (typeof clipIndex !== "number") return err("clipIndex must be a number");

  const elapsedSec = payload.elapsedSec;
  if (typeof elapsedSec !== "number" || elapsedSec < 0) {
    return err("elapsedSec must be a non-negative number");
  }

  const durationSec = payload.durationSec;
  if (typeof durationSec !== "number" || durationSec < 0) {
    return err("durationSec must be a non-negative number");
  }

  const currentRes = await db
    .from("video_progress")
    .select("elapsed_sec")
    .eq("user_id", actor.id)
    .eq("lesson_id", lessonId)
    .eq("clip_index", clipIndex)
    .maybeSingle();

  if (currentRes.error) throw currentRes.error;

  const storedElapsed = currentRes.data ? Number(currentRes.data.elapsed_sec) : -1;

  if (elapsedSec > storedElapsed) {
    const upsertRes = await db.from("video_progress").upsert(
      {
        user_id: actor.id,
        lesson_id: lessonId,
        clip_index: clipIndex,
        elapsed_sec: elapsedSec,
        duration_sec: durationSec,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id,clip_index" },
    );
    if (upsertRes.error) throw upsertRes.error;
  }

  return ok();
}

// ---------------------------------------------------------------------------
// Admin-only action handlers
// ---------------------------------------------------------------------------

async function handleSetStatus(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  const status = payload.status;
  if (status !== "active" && status !== "paused") {
    return err("status must be 'active' or 'paused'");
  }

  const updateRes = await db
    .from("profiles")
    .update({ status })
    .eq("id", targetUserId);
  if (updateRes.error) throw updateRes.error;

  return ok();
}

async function handleUnlockModule(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  const moduleId = payload.moduleId;
  if (typeof moduleId !== "string" || !moduleId) return err("moduleId is required");

  const ins = await db
    .from("module_access")
    .insert({
      user_id: targetUserId,
      module_id: moduleId,
      granted_by: actor.id,
      granted_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (ins.error && ins.error.code !== "23505") throw ins.error;

  return ok();
}

async function handleLockModule(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  const moduleId = payload.moduleId;
  if (typeof moduleId !== "string" || !moduleId) return err("moduleId is required");

  const del = await db
    .from("module_access")
    .delete()
    .eq("user_id", targetUserId)
    .eq("module_id", moduleId);
  if (del.error) throw del.error;

  return ok();
}

async function handleUnlockAll(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  const rows = PAID_MODULE_IDS.map((moduleId) => ({
    user_id: targetUserId,
    module_id: moduleId,
    granted_by: actor.id,
    granted_at: new Date().toISOString(),
  }));

  const ins = await db
    .from("module_access")
    .upsert(rows, { onConflict: "user_id,module_id", ignoreDuplicates: true });
  if (ins.error) throw ins.error;

  return ok();
}

async function handleLockAll(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  const del = await db
    .from("module_access")
    .delete()
    .eq("user_id", targetUserId);
  if (del.error) throw del.error;

  return ok();
}

async function handleRemoveUser(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  if (targetUserId === actor.id) {
    return err("You cannot remove your own account", 400);
  }

  // Delete the auth user. The profiles row (and all dependent data) is removed
  // via ON DELETE CASCADE on the FK to auth.users, so a deleted user cannot
  // sign back in and "resurrect" their profile.
  const { error: deleteError } = await db.auth.admin.deleteUser(targetUserId);
  if (deleteError) {
    return err(`Failed to remove user: ${deleteError.message}`, 500);
  }

  return ok();
}

async function handleSetHomeworkDone(
  db: SupabaseClient,
  actor: ActorProfile,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (actor.role !== "admin") return err("Admin only", 403);

  const targetUserId = payload.targetUserId;
  if (typeof targetUserId !== "string" || !targetUserId) {
    return err("targetUserId is required");
  }

  const lessonId = payload.lessonId;
  if (typeof lessonId !== "string" || !lessonId) return err("lessonId is required");

  const done = payload.done;
  if (typeof done !== "boolean") return err("done must be a boolean");

  if (done) {
    const ins = await db
      .from("homework")
      .insert({ user_id: targetUserId, lesson_id: lessonId })
      .select()
      .maybeSingle();
    if (ins.error && ins.error.code !== "23505") throw ins.error;
  } else {
    const del = await db
      .from("homework")
      .delete()
      .eq("user_id", targetUserId)
      .eq("lesson_id", lessonId);
    if (del.error) throw del.error;
  }

  return ok();
}

// ---------------------------------------------------------------------------
// POST handler -- dispatcher
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // --- 1. Authenticate: derive actor from session cookie ---
  let sessionClient: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    sessionClient = await createServerSupabase();
  } catch {
    return err("Auth service unavailable", 503);
  }

  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) {
    return err("Unauthorized", 401);
  }

  const sessionUserId = user.id;

  // --- 2. Parse body ---
  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return err("Invalid JSON body");
  }

  const { action, payload = {} } = body;
  if (!action || typeof action !== "string") return err("action is required");

  // --- 3. Load actor profile from DB (authoritative source for role/status) ---
  const db = createAdminClient();

  let actor: ActorProfile | null;
  try {
    actor = await loadActor(db, sessionUserId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load actor";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }

  if (!actor) return err("User profile not found", 404);

  // --- 4. Dispatch ---
  try {
    switch (action) {
      case "toggleComplete":
        return await handleToggleComplete(db, actor, payload);
      case "markComplete":
        return await handleMarkComplete(db, actor, payload);
      case "toggleHomework":
        return await handleToggleHomework(db, actor, payload);
      case "recordVideoProgress":
        return await handleRecordVideoProgress(db, actor, payload);
      case "setStatus":
        return await handleSetStatus(db, actor, payload);
      case "unlockModule":
        return await handleUnlockModule(db, actor, payload);
      case "lockModule":
        return await handleLockModule(db, actor, payload);
      case "unlockAll":
        return await handleUnlockAll(db, actor, payload);
      case "lockAll":
        return await handleLockAll(db, actor, payload);
      case "removeUser":
        return await handleRemoveUser(db, actor, payload);
      case "setHomeworkDone":
        return await handleSetHomeworkDone(db, actor, payload);
      default:
        return err(`Unknown action: ${action}`, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
