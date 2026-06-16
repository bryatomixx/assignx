import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";

// Disable caching -- audit log is always real-time.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function err(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

// Fields that may be filtered on. Anything outside this set is rejected so the
// query param cannot be used to probe arbitrary column values.
const ALLOWED_FIELDS = new Set([
  "name",
  "email",
  "bio",
  "avatar_url",
  "password",
  "role",
  "status",
  "timezone",
]);

// ---------------------------------------------------------------------------
// GET /api/admin/audit
//
// Query params:
//   userId   (optional) filter by profile_id
//   field    (optional) filter by field name
//   page     (optional, default 1) 1-based page number
//   pageSize (optional, default 25, max 100)
//
// Authorization: session user must have role='admin' in profiles table.
//
// Response shape:
//   {
//     rows: AuditRow[],
//     total: number,
//     page: number,
//     pageSize: number,
//   }
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
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

  const actorId = user.id;

  // --- 2. Authorize: verify actor is admin (server-side, from DB) ---
  const db = createAdminClient();

  const profileRes = await db
    .from("profiles")
    .select("role")
    .eq("id", actorId)
    .single();

  if (profileRes.error || !profileRes.data) {
    return err("Profile not found", 404);
  }

  if (profileRes.data.role !== "admin") {
    return err("Forbidden: admin access required", 403);
  }

  // --- 3. Parse query params ---
  const { searchParams } = new URL(request.url);
  const filterUserId = searchParams.get("userId") ?? undefined;
  const filterField = searchParams.get("field") ?? undefined;

  // Whitelist the field filter to avoid arbitrary column probing.
  if (filterField && !ALLOWED_FIELDS.has(filterField)) {
    return err("Invalid field filter", 400);
  }
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeRaw = parseInt(searchParams.get("pageSize") ?? "25", 10);

  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const pageSize = isNaN(pageSizeRaw) || pageSizeRaw < 1 ? 25 : Math.min(pageSizeRaw, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // --- 4. Query profile_change_history with filters ---
  let query = db
    .from("profile_change_history")
    .select(
      `
      id,
      profile_id,
      changed_by,
      field,
      old_value,
      new_value,
      created_at,
      affected:profiles!profile_change_history_profile_id_fkey(id, name, avatar),
      actor:profiles!profile_change_history_changed_by_fkey(id, name, avatar)
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filterUserId) {
    query = query.eq("profile_id", filterUserId);
  }
  if (filterField) {
    query = query.eq("field", filterField);
  }

  const { data, error: queryError, count } = await query;

  if (queryError) {
    console.error("[admin/audit] query error:", queryError.message);
    return err("Failed to load audit log", 500);
  }

  return Response.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
