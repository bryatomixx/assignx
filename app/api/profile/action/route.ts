import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Disable caching -- this route mutates profile state.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionBody {
  action: string;
  payload?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function ok(data?: Record<string, unknown>): Response {
  return Response.json({ ok: true, ...data });
}

function err(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

// IANA timezone validation using Intl (built-in, no deps).
function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Audit logger
// ---------------------------------------------------------------------------

async function recordChange(
  db: SupabaseClient,
  profileId: string,
  changedBy: string,
  field: string,
  oldValue: string | null,
  newValue: string | null,
): Promise<void> {
  const ins = await db.from("profile_change_history").insert({
    profile_id: profileId,
    changed_by: changedBy,
    field,
    old_value: oldValue,
    new_value: newValue,
    created_at: new Date().toISOString(),
  });
  if (ins.error) {
    // Log but do not abort the main operation; audit failure must not block the user.
    console.error("[profile/action] audit insert failed:", ins.error.message);
  }
}

// ---------------------------------------------------------------------------
// Action: updateProfile
// ---------------------------------------------------------------------------

async function handleUpdateProfile(
  db: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  const { name, bio, timezone } = payload as {
    name?: unknown;
    bio?: unknown;
    timezone?: unknown;
  };

  // Validate provided fields.
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return err("name must be between 2 and 80 characters");
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > 300) {
      return err("bio must be at most 300 characters");
    }
  }

  if (timezone !== undefined) {
    if (typeof timezone !== "string" || !isValidIANATimezone(timezone)) {
      return err("timezone must be a valid IANA timezone string (e.g. America/New_York)");
    }
  }

  if (name === undefined && bio === undefined && timezone === undefined) {
    return err("At least one field (name, bio, timezone) must be provided");
  }

  // Load current profile for old_values.
  const currentRes = await db
    .from("profiles")
    .select("name, bio, timezone")
    .eq("id", userId)
    .single();

  if (currentRes.error || !currentRes.data) {
    return err("Profile not found", 404);
  }

  const current = currentRes.data as {
    name: string;
    bio: string | null;
    timezone: string;
  };

  // Build update object.
  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = (name as string).trim();
  if (bio !== undefined) updates.bio = bio as string;
  if (timezone !== undefined) updates.timezone = timezone as string;

  const updateRes = await db
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (updateRes.error) throw updateRes.error;

  // Audit each changed field.
  const auditTasks: Promise<void>[] = [];

  if (name !== undefined && (name as string).trim() !== current.name) {
    auditTasks.push(
      recordChange(db, userId, userId, "name", current.name, (name as string).trim()),
    );
  }
  if (bio !== undefined && (bio as string) !== (current.bio ?? "")) {
    auditTasks.push(
      recordChange(db, userId, userId, "bio", current.bio ?? null, bio as string),
    );
  }
  if (timezone !== undefined && (timezone as string) !== current.timezone) {
    auditTasks.push(
      recordChange(db, userId, userId, "timezone", current.timezone, timezone as string),
    );
  }

  await Promise.all(auditTasks);

  return ok();
}

// ---------------------------------------------------------------------------
// Action: uploadAvatarComplete
// ---------------------------------------------------------------------------
// Avatar file upload strategy: the client uploads the file directly to
// Supabase Storage using the browser client against the `avatars` bucket
// under `${uid}/avatar.<ext>`. After a successful upload the client calls
// this endpoint with the public URL to persist it on the profile and audit
// the change.
//
// Why client-side upload: the file never passes through Next.js, avoiding
// memory pressure on the Node.js process and keeping this endpoint simple.
// The bucket path is scoped to the user's own UID so no other user can
// overwrite it without admin access.

async function handleUploadAvatarComplete(
  db: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  const avatarUrl = payload.avatar_url;
  if (typeof avatarUrl !== "string" || !avatarUrl) {
    return err("avatar_url is required");
  }

  // Basic URL safety check.
  try {
    const parsed = new URL(avatarUrl);
    if (parsed.protocol !== "https:") {
      return err("avatar_url must use https");
    }
  } catch {
    return err("avatar_url must be a valid URL");
  }

  // Restrict the URL to the user's own avatars folder in our Supabase bucket so
  // a user cannot persist an arbitrary external URL on their profile.
  const expectedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/`;
  if (!avatarUrl.startsWith(expectedPrefix)) {
    return err("avatar_url must be in your own avatars folder");
  }

  // Fetch old value for audit.
  const currentRes = await db
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  const oldAvatarUrl = currentRes.data?.avatar_url ?? null;

  const updateRes = await db
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (updateRes.error) throw updateRes.error;

  await recordChange(db, userId, userId, "avatar_url", oldAvatarUrl, avatarUrl);

  return ok();
}

// ---------------------------------------------------------------------------
// Action: recordPasswordChange
// ---------------------------------------------------------------------------
// The actual password change is performed CLIENT-SIDE via:
//   1. supabase.auth.signInWithPassword({ email, password: currentPassword })
//      (re-verify current password)
//   2. supabase.auth.updateUser({ password: newPassword })
// Then the client calls this endpoint to audit the event.
// old_value and new_value are ALWAYS null for password -- never stored.

async function handleRecordPasswordChange(
  db: SupabaseClient,
  userId: string,
): Promise<Response> {
  await recordChange(db, userId, userId, "password", null, null);
  return ok();
}

// ---------------------------------------------------------------------------
// POST handler -- dispatcher
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // --- 1. Authenticate ---
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

  const userId = user.id;

  // --- 2. Parse body ---
  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return err("Invalid JSON body");
  }

  const { action, payload = {} } = body;
  if (!action || typeof action !== "string") return err("action is required");

  // --- 3. Use admin client for writes (bypasses RLS so we can always write) ---
  const db = createAdminClient();

  // --- 4. Dispatch ---
  try {
    switch (action) {
      case "updateProfile":
        return await handleUpdateProfile(db, userId, payload);
      case "uploadAvatarComplete":
        return await handleUploadAvatarComplete(db, userId, payload);
      case "recordPasswordChange":
        return await handleRecordPasswordChange(db, userId);
      default:
        return err(`Unknown action: ${action}`, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
