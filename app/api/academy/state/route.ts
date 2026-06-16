import { createAdminClient } from "@/lib/supabase/server";

// Disable caching -- academy state changes frequently.
export const dynamic = "force-dynamic";

// ---- DB row types (snake_case from Supabase) ----

interface DbProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
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

function mapProfile(r: DbProfile) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as "admin" | "student",
    status: r.status as "active" | "paused",
    avatar: r.avatar,
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
  try {
    const db = createAdminClient();

    const [profilesRes, progressRes, homeworkRes, videoProgressRes, moduleAccessRes] =
      await Promise.all([
        db.from("profiles").select("id, name, email, role, status, avatar"),
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
      profiles: (profilesRes.data as DbProfile[]).map(mapProfile),
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
