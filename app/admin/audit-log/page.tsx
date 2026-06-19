"use client";

// Next.js 16 App Router client component.
// Admin-gated: redirects to /login if not authenticated or not admin.
// Audit log: shows profile_change_history with filters and pagination.

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { BackToDashboard } from "@/components/admin/BackToDashboard";
import { Avatar } from "@/components/ui/Avatar";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { fetchAuditLog } from "@/lib/admin/api";
import type { AuditRow, AuditResponse } from "@/lib/admin/api";
import { formatDual } from "@/lib/time";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Field display helpers
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  name: "Full name",
  bio: "Bio",
  avatar_url: "Profile photo",
  password: "Password",
  email: "Email",
  role: "Role",
  status: "Status",
  timezone: "Timezone",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

const FIELD_OPTIONS = [
  { value: "", label: "All fields" },
  ...Object.entries(FIELD_LABELS).map(([value, label]) => ({ value, label })),
];

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Timestamp cell (2-line PT + local)
// ---------------------------------------------------------------------------

function TimestampCell({
  iso,
  userTz,
}: {
  iso: string;
  userTz?: string;
}) {
  const { pt, local } = formatDual(iso, userTz);
  const sameAsLocal = pt === local || userTz === "America/Los_Angeles";
  return (
    <div className="min-w-[160px]">
      <div className="font-medium text-ink-700">{pt}</div>
      {!sameAsLocal && (
        <div className="mt-0.5 text-xs text-ink-300">{local}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value cell (truncate long values, show "hidden" for password)
// ---------------------------------------------------------------------------

function ValueCell({
  value,
  isPassword,
  placeholder,
}: {
  value: string | null;
  isPassword: boolean;
  placeholder?: string;
}) {
  if (isPassword) {
    return (
      <span className="text-ink-300 italic">
        {placeholder ?? "(hidden)"}
      </span>
    );
  }
  if (!value) {
    return <span className="text-ink-300 italic">(empty)</span>;
  }
  return (
    <span
      className="block max-w-[160px] truncate"
      title={value}
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 animate-pulse rounded bg-surface-3" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// AuditContent (uses admin context, renders table)
// ---------------------------------------------------------------------------

function AuditContent() {
  const { users, authLoading, currentUser } = useAcademy();

  const [filterUserId, setFilterUserId] = useState("");
  const [filterField, setFilterField] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAuditLog({
        userId: filterUserId || undefined,
        field: filterField || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit log.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterUserId, filterField, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && currentUser) void load();
  }, [authLoading, currentUser, load]);

  const resetFilters = () => {
    setFilterUserId("");
    setFilterField("");
    setPage(1);
  };

  const hasFilters = filterUserId !== "" || filterField !== "";
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, total);

  // User options for filter dropdown
  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const renderBody = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} cols={5} />
      ));
    }

    if (error) {
      return (
        <tr>
          <td colSpan={5} className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-surface-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </button>
          </td>
        </tr>
      );
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="px-5 py-12 text-center">
            {hasFilters ? (
              <>
                <p className="font-medium text-ink-700">
                  No changes match your filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-surface-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="font-medium text-ink-700">
                  No profile changes recorded yet.
                </p>
                <p className="mt-1 text-sm text-ink-300">
                  Changes will appear here when partners update their profiles.
                </p>
              </>
            )}
          </td>
        </tr>
      );
    }

    return rows.map((row: AuditRow, i: number) => {
      const isPassword = row.field === "password";
      return (
        <motion.tr
          key={row.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: i * 0.02 }}
          className="border-b border-line last:border-0"
        >
          {/* When */}
          <td className="px-5 py-4">
            <TimestampCell iso={row.created_at} />
          </td>

          {/* User (affected + actor) */}
          <td className="px-5 py-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {row.affected?.avatar ? (
                  <Avatar emoji={row.affected.avatar} size="sm" />
                ) : null}
                <span className="font-medium text-ink-900">
                  {row.affected?.name ?? row.profile_id}
                </span>
              </div>
              {row.actor && row.actor.id !== row.affected?.id && (
                <div className="flex items-center gap-1.5 text-xs text-ink-300">
                  <Avatar emoji={row.actor.avatar} size="sm" />
                  <span>by {row.actor.name}</span>
                </div>
              )}
            </div>
          </td>

          {/* Field */}
          <td className="px-5 py-4">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                "bg-brand-50 text-brand-700",
              )}
            >
              {fieldLabel(row.field)}
            </span>
          </td>

          {/* Previous value */}
          <td className="px-5 py-4 text-sm text-ink-500">
            <ValueCell
              value={row.old_value}
              isPassword={isPassword}
              placeholder="(hidden)"
            />
          </td>

          {/* New value */}
          <td className="px-5 py-4 text-sm text-ink-700">
            <ValueCell
              value={row.new_value}
              isPassword={isPassword}
              placeholder="(changed)"
            />
          </td>
        </motion.tr>
      );
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      {/* Header */}
      <BackToDashboard />
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
        Admin
      </p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Audit Log</h1>
      <p className="mt-2 text-ink-500">
        A record of all profile changes made by partners and admins.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* User filter */}
        <select
          value={filterUserId}
          onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          aria-label="Filter by user"
        >
          <option value="">All users</option>
          {userOptions.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>

        {/* Field filter */}
        <select
          value={filterField}
          onChange={(e) => { setFilterField(e.target.value); setPage(1); }}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          aria-label="Filter by field"
        >
          {FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-500 hover:bg-surface-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-line">
                {["When", "User", "Field", "Previous value", "New value"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-300"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <p className="text-xs text-ink-300">
              Showing {startRow}-{endRow} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-500 hover:bg-surface-2 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-ink-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-500 hover:bg-surface-2 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export: wrapped in AdminGuard
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  return (
    <AdminGuard>
      <AuditContent />
    </AdminGuard>
  );
}
