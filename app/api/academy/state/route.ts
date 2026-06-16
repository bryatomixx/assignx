import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";

// Disable caching -- academy state changes frequently.
export const dynamic = "force-dynamic";

// ---- DB row types (snake_case from Supabase) ----

interface DbProfile {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  avatar: string;
  joined_at: string | null;
  bio: string | null;
}

interface DbLessonProgress {
  user_id: string;
  lesson_id: string;
}

interface DbHomework {
  user_id: string;
  lesson_id: string;
}

interface DbVideoProgress {
  user_id: string;
  lesson_id: string;
  clip_index: number;
  elapsed_sec: number;
  duration_sec: number;
}

interface DbModuleAccess {
  user_id: string;
  module_id: string;
}

// ---- Mappers: DB row -> camelCase ----

// Email is PII: include it only when the viewer is an admin or it is the
// viewer's own profile. For all other profiles it is returned as null.
// bio is a public self-description and is always returned for all profiles.
function mapProfile(r: DbProfile, viewerId: string, viewerIsAdmin: boolean) {
  const canSeeEmail = viewerIsAdmin || r.id === viewerId;
  return {
    id: r.id,
    name: r.name,
    email: canSeeEmail ? r.email : null,
    role: r.role as "admin" | "student",
    status: r.status as "active" | "paused",
    avatar: r.avatar,
    joinedAt: r.joined_at,
    bio: r.bio,
  };
}

function mapProgress(r: DbLessonProgress) {
  return { userId: r.user_id, lessonId: r.lesson_id };
}

function mapHomework(r: DbHomework) {
  return { userId: r.user_id, lessonId: r.lesson_id };
}

function mapVideoProgress(r: DbVideoProgress) {
  return {
    userId: r.user_id,
    lessonId: r.lesson_id,
    clipIndex: r.clip_index,
    elapsedSec: Number(r.elapsed_sec),
    durationSec: Number(r.duration_sec),
  };
}

function mapModuleAccess(r: DbModuleAccess) {
  return { userId: r.user_id, moduleId: r.module_id };
}

// ---- Route handler ----

export async function GET(): Promise<Response> {
  // Require authenticated session before returning any academy state.
  let viewerId: string;
  try {
    const sessionClient = await createServerSupabase();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    viewerId = user.id;
  } catch {
    return Response.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  try {
    const db = createAdminClient();

    // Determine whether the viewer is an admin (controls email visibility).
    const viewerRes = await db
      .from("profiles")
      .select("role")
      .eq("id", viewerId)
      .single();
    const viewerIsAdmin = viewerRes.data?.role === "admin";

    const [profilesRes, progressRes, homeworkRes, videoProgressRes, moduleAccessRes] =
      await Promise.all([
        db.from("profiles").select("id, name, email, role, status, avatar, joined_at, bio"),
        db.from("lesson_progress").select("user_id, lesson_id"),
        db.from("homework").select("user_id, lesson_id"),
        db.from("video_progress").select("user_id, lesson_id, clip_index, elapsed_sec, duration_sec"),
        db.from("module_access").select("user_id, module_id"),
      ]);

    if (profilesRes.error) throw profilesRes.error;
    if (progressRes.error) throw progressRes.error;
    if (homeworkRes.error) throw homeworkRes.error;
    if (videoProgressRes.error) throw videoProgressRes.error;
    if (moduleAccessRes.error) throw moduleAccessRes.error;

    return Response.json({
      profiles: (profilesRes.data as DbProfile[]).map((p) =>
        mapProfile(p, viewerId, viewerIsAdmin),
      ),
      progress: (progressRes.data as DbLessonProgress[]).map(mapProgress),
      homework: (homeworkRes.data as DbHomework[]).map(mapHomework),
      videoProgress: (videoProgressRes.data as DbVideoProgress[]).map(mapVideoProgress),
      moduleAccess: (moduleAccessRes.data as DbModuleAccess[]).map(mapModuleAccess),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
