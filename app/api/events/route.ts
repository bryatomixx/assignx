import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// This route mutates state and reads live data -- never cache.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface DbEvent {
  id: string;
  title: string;
  link: string | null;
  timezone: string;
  start_time: string;
  recurrence: "once" | "weekly" | "monthly";
  event_date: string | null;
  day_of_week: number | null;
  day_of_month: number | null;
}

function mapEvent(r: DbEvent) {
  return {
    id: r.id,
    title: r.title,
    link: r.link ?? null,
    timezone: r.timezone,
    startTime: r.start_time,
    recurrence: r.recurrence,
    eventDate: r.event_date ?? null,
    dayOfWeek: r.day_of_week ?? null,
    dayOfMonth: r.day_of_month ?? null,
  };
}

interface EventRow {
  title: string;
  link: string | null;
  timezone: string;
  start_time: string;
  recurrence: "once" | "weekly" | "monthly";
  event_date: string | null;
  day_of_week: number | null;
  day_of_month: number | null;
}

// Validate + normalize a create/update payload into a DB row.
function buildEventRow(
  payload: Record<string, unknown>,
): { ok: true; row: EventRow } | { ok: false; error: string } {
  const title =
    typeof payload.title === "string" ? payload.title.trim().slice(0, 200) : "";
  if (!title) return { ok: false, error: "Title is required" };

  const rawLink = typeof payload.link === "string" ? payload.link.trim() : "";
  const link = rawLink || null;
  if (link && !isSafeUrl(link)) {
    return { ok: false, error: "Link must be a valid http/https URL" };
  }

  const timezone =
    (typeof payload.timezone === "string" && payload.timezone.trim()) || "EST";

  const startTime =
    typeof payload.startTime === "string" && /^\d{1,2}:\d{2}$/.test(payload.startTime)
      ? payload.startTime
      : null;
  if (!startTime) return { ok: false, error: "A valid time (HH:MM) is required" };

  const recurrence = payload.recurrence;
  if (recurrence !== "once" && recurrence !== "weekly" && recurrence !== "monthly") {
    return { ok: false, error: "Invalid recurrence" };
  }

  const row: EventRow = {
    title,
    link,
    timezone,
    start_time: startTime,
    recurrence,
    event_date: null,
    day_of_week: null,
    day_of_month: null,
  };

  if (recurrence === "once") {
    if (
      typeof payload.eventDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.eventDate)
    ) {
      return { ok: false, error: "A date is required for a one-time event" };
    }
    row.event_date = payload.eventDate;
  } else if (recurrence === "weekly") {
    const dow = Number(payload.dayOfWeek);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
      return { ok: false, error: "A day of the week is required for a weekly event" };
    }
    row.day_of_week = dow;
  } else {
    const dom = Number(payload.dayOfMonth);
    if (!Number.isInteger(dom) || dom < 1 || dom > 31) {
      return { ok: false, error: "A day of the month is required for a monthly event" };
    }
    row.day_of_month = dom;
  }

  return { ok: true, row };
}

function ok(data: Record<string, unknown> = {}): Response {
  return Response.json({ ok: true, ...data });
}
function err(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}

// Resolve the session user id, or null.
async function sessionUserId(): Promise<string | null> {
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function isAdmin(db: SupabaseClient, userId: string): Promise<boolean> {
  const res = await db.from("profiles").select("role").eq("id", userId).single();
  return !res.error && res.data?.role === "admin";
}

// ---------------------------------------------------------------------------
// GET: list all events (any authenticated user)
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  const userId = await sessionUserId();
  if (!userId) return err("Unauthorized", 401);

  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return err(error.message, 500);

  return Response.json({ events: (data as DbEvent[]).map(mapEvent) });
}

// ---------------------------------------------------------------------------
// POST: admin actions (create / update / delete)
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const userId = await sessionUserId();
  if (!userId) return err("Unauthorized", 401);

  const db = createAdminClient();
  if (!(await isAdmin(db, userId))) return err("Admins only", 403);

  let body: { action?: string; payload?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return err("Invalid JSON body");
  }
  const action = body.action;
  const payload = body.payload ?? {};

  try {
    if (action === "create") {
      const built = buildEventRow(payload);
      if (!built.ok) return err(built.error);
      const insert = await db
        .from("events")
        .insert({ ...built.row, created_by: userId });
      if (insert.error) throw insert.error;
      return ok();
    }

    if (action === "update") {
      const id = payload.id;
      if (typeof id !== "string" || !id) return err("Event id is required");
      const built = buildEventRow(payload);
      if (!built.ok) return err(built.error);
      const update = await db.from("events").update(built.row).eq("id", id);
      if (update.error) throw update.error;
      return ok();
    }

    if (action === "delete") {
      const id = payload.id;
      if (typeof id !== "string" || !id) return err("Event id is required");
      const del = await db.from("events").delete().eq("id", id);
      if (del.error) throw del.error;
      return ok();
    }

    return err(`Unknown action: ${action ?? "(none)"}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return err(msg, 500);
  }
}
