import type { AcademyEvent, EventInput } from "./types";

/** Fetch every event (any authenticated user). Returns [] on failure. */
export async function fetchEvents(): Promise<AcademyEvent[]> {
  try {
    const res = await fetch("/api/events", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: AcademyEvent[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Broadcast so live consumers (the sidebar) can refresh after a change. */
export const EVENTS_CHANGED = "events:changed";

async function action(
  name: "create" | "update" | "delete",
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: name, payload }),
    });
    const result = (await res.json()) as ActionResult;
    if (result.ok && typeof window !== "undefined") {
      window.dispatchEvent(new Event(EVENTS_CHANGED));
    }
    return result;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}

export function createEvent(input: EventInput): Promise<ActionResult> {
  return action("create", { ...input });
}

export function updateEvent(id: string, input: EventInput): Promise<ActionResult> {
  return action("update", { id, ...input });
}

export function deleteEvent(id: string): Promise<ActionResult> {
  return action("delete", { id });
}
