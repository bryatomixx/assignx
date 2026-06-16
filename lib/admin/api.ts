/**
 * lib/admin/api.ts
 *
 * Typed client-side wrapper for GET /api/admin/audit.
 * Uses fetch only. Requires an active admin session (cookie-based).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single row from profile_change_history with joined profile data.
 * Returned by GET /api/admin/audit.
 */
export interface AuditRow {
  id: string;
  profile_id: string;
  changed_by: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string; // ISO UTC timestamp
  // Joined from profiles for the affected user.
  affected: { id: string; name: string; avatar: string } | null;
  // Joined from profiles for the actor (who made the change).
  actor: { id: string; name: string; avatar: string } | null;
}

export interface AuditResponse {
  rows: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// fetchAuditLog
// ---------------------------------------------------------------------------

/**
 * Fetches the profile change audit log. Admin session required.
 *
 * @param opts.userId    - Filter rows to a specific profile_id.
 * @param opts.field     - Filter rows to a specific field name.
 * @param opts.page      - 1-based page number (default 1).
 * @param opts.pageSize  - Rows per page, max 100 (default 25).
 */
export async function fetchAuditLog(opts?: {
  userId?: string;
  field?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditResponse> {
  const params = new URLSearchParams();
  if (opts?.userId) params.set("userId", opts.userId);
  if (opts?.field) params.set("field", opts.field);
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.pageSize != null) params.set("pageSize", String(opts.pageSize));

  const qs = params.toString();
  const url = `/api/admin/audit${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to fetch audit log: ${res.status}`);
  }
  return res.json() as Promise<AuditResponse>;
}
