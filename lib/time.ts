/**
 * lib/time.ts
 *
 * Pure, dependency-free time formatting utilities.
 * All functions use the built-in Intl API. No external packages required.
 * DST transitions are handled automatically by Intl -- offsets are never
 * hardcoded.
 *
 * All inputs must be ISO 8601 strings (UTC or with offset) as stored in the DB.
 *
 * Contract (for the frontend):
 *   formatPT(iso)             -> "Jun 16, 2026, 2:30 PM PT"
 *   formatLocal(iso, tz?)     -> formatted in the given IANA timezone (or the
 *                                browser/OS detected timezone if omitted)
 *   formatDual(iso, userTz?)  -> { pt: string; local: string }
 *                                Use pt as primary display; local as secondary
 *                                (omit local if it equals pt).
 *   formatDateShort(iso)      -> "Jun 16, 2026" (date only, in PT)
 *   formatRelative(iso)       -> "2 hours ago" | "just now" | "in 3 days"
 *                                (coarse, for audit log / notification feeds)
 */

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const PT_TIMEZONE = "America/Los_Angeles";

/** The Intl label to append for Pacific time ("PT" covers both PST and PDT). */
const PT_LABEL = "PT";

/** Fallback returned when an input cannot be parsed into a valid date. */
const INVALID_DATE_FALLBACK = "Unknown";

/**
 * Parses an ISO string into a Date, returning null when the result is an
 * Invalid Date (e.g. null, "", or a malformed string). Callers fall back to a
 * safe placeholder so formatting never throws a RangeError.
 */
function parseDate(iso: string | null | undefined): Date | null {
  if (iso == null) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildDateFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Formats an ISO timestamp in Pacific time.
 * Example: "Jun 16, 2026, 2:30 PM PT"
 */
export function formatPT(iso: string): string {
  const d = parseDate(iso);
  if (!d) return INVALID_DATE_FALLBACK;
  return `${buildFormatter(PT_TIMEZONE).format(d)} ${PT_LABEL}`;
}

/**
 * Formats an ISO timestamp in the given IANA timezone.
 * Falls back to the browser/OS timezone if tz is not provided or invalid.
 * Example: "Jun 16, 2026, 5:30 PM" (in America/New_York)
 */
export function formatLocal(iso: string, tz?: string): string {
  const d = parseDate(iso);
  if (!d) return INVALID_DATE_FALLBACK;

  // Treat an empty-string tz the same as undefined (use the OS/browser zone);
  // passing "" to Intl throws a RangeError.
  let timeZone: string | undefined = tz != null && tz !== "" ? tz : undefined;

  if (timeZone) {
    // Validate the caller-supplied timezone; fall back gracefully on invalid value.
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
    } catch {
      timeZone = undefined;
    }
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Returns both PT and local representations.
 * Use `pt` as the primary display value and `local` as a secondary hint.
 * If `local` equals `pt` (user is in PT), the UI can omit the secondary.
 *
 * Example:
 *   { pt: "Jun 16, 2026, 2:30 PM PT", local: "Jun 16, 2026, 5:30 PM" }
 */
export function formatDual(
  iso: string,
  userTz?: string,
): { pt: string; local: string } {
  return {
    pt: formatPT(iso),
    local: formatLocal(iso, userTz),
  };
}

/**
 * Returns the date portion only, formatted in Pacific time.
 * Example: "Jun 16, 2026"
 */
export function formatDateShort(iso: string): string {
  const d = parseDate(iso);
  if (!d) return INVALID_DATE_FALLBACK;
  return buildDateFormatter(PT_TIMEZONE).format(d);
}

/**
 * Returns a coarse relative time string suitable for notification feeds
 * and audit logs. Uses the current wall clock time as the reference point.
 *
 * Examples:
 *   "just now"     (< 60 seconds ago)
 *   "2 minutes ago"
 *   "3 hours ago"
 *   "yesterday"
 *   "5 days ago"
 *   "Jun 16, 2026" (> 30 days ago, falls back to date)
 */
export function formatRelative(iso: string): string {
  const parsed = parseDate(iso);
  if (!parsed) return INVALID_DATE_FALLBACK;

  const now = Date.now();
  const then = parsed.getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) {
    // Future date (clock skew or scheduled items).
    const absDiffSec = Math.abs(diffSec);
    if (absDiffSec < 60) return "in a moment";
    if (absDiffSec < 3600) return `in ${Math.floor(absDiffSec / 60)} minutes`;
    if (absDiffSec < 86400) return `in ${Math.floor(absDiffSec / 3600)} hours`;
    return `in ${Math.floor(absDiffSec / 86400)} days`;
  }

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffSec < 86400) {
    const hrs = Math.floor(diffSec / 3600);
    return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  }
  if (diffSec < 2 * 86400) return "yesterday";
  if (diffSec < 30 * 86400) {
    const days = Math.floor(diffSec / 86400);
    return `${days} days ago`;
  }

  // Older than 30 days: show absolute date in PT.
  return formatDateShort(iso);
}
