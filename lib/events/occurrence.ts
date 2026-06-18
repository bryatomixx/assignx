import type { AcademyEvent } from "./types";

/**
 * The next occurrence of an event at or after `now`, as a Date.
 *   - once    -> its specific date/time (may be in the past; the caller filters)
 *   - weekly  -> the next date matching its day-of-week, at its time
 *   - monthly -> the next date matching its day-of-month, at its time
 * Date math is done at the day level; the time + timezone are display-only and
 * are not converted to the viewer's timezone.
 */
export function nextOccurrence(ev: AcademyEvent, now: Date): Date | null {
  const [h, m] = ev.startTime.split(":").map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  if (ev.recurrence === "once") {
    if (!ev.eventDate) return null;
    const [y, mo, d] = ev.eventDate.split("-").map((n) => Number(n));
    return new Date(y, mo - 1, d, h, m, 0, 0);
  }

  if (ev.recurrence === "weekly") {
    if (ev.dayOfWeek == null) return null;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    let diff = (ev.dayOfWeek - d.getDay() + 7) % 7;
    if (diff === 0 && d.getTime() <= now.getTime()) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  if (ev.recurrence === "monthly") {
    if (ev.dayOfMonth == null) return null;
    // Walk forward month by month until we find one with this day, still future.
    for (let i = 0; i < 14; i++) {
      const year = now.getFullYear();
      const month = now.getMonth() + i;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      if (ev.dayOfMonth > daysInMonth) continue; // e.g. day 31 in February
      const candidate = new Date(year, month, ev.dayOfMonth, h, m, 0, 0);
      if (candidate.getTime() > now.getTime()) return candidate;
    }
    return null;
  }

  return null;
}

/** "2:00 PM" from "14:00". */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

/** "Jun 24, 2026" from a Date. */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Events with their next occurrence, future-only, sorted soonest first.
 * (A one-time event in the past is dropped.)
 */
export function upcomingEvents(
  events: AcademyEvent[],
  now: Date,
): { event: AcademyEvent; next: Date }[] {
  return events
    .map((event) => ({ event, next: nextOccurrence(event, now) }))
    .filter(
      (e): e is { event: AcademyEvent; next: Date } =>
        e.next !== null && e.next.getTime() >= now.getTime(),
    )
    .sort((a, b) => a.next.getTime() - b.next.getTime());
}
