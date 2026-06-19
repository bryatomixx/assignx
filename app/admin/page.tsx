"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Users, CheckCircle2 } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { BackToDashboard } from "@/components/admin/BackToDashboard";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate } from "@/lib/utils";

function AdminContent() {
  const { users, overallPct } = useAcademy();
  const students = users.filter((u) => u.role === "student");
  const completed = students.filter((u) => overallPct(u.id) === 100).length;
  const active = students.filter((u) => {
    const p = overallPct(u.id);
    return p > 0 && p < 100;
  }).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <BackToDashboard />
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
        Admin
      </p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Partners</h1>
      <p className="mt-2 text-ink-500">
        Track how your partners are progressing through the free course.
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Partners" value={students.length} icon />
        <Stat label="In progress" value={active} />
        <Stat label="Completed" value={completed} />
      </div>

      {/* Table */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-white">
        <div className="hidden grid-cols-[1.8fr_1.2fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-300 sm:grid">
          <span>Partner</span>
          <span>Progress</span>
          <span />
        </div>
        {students.map((u, i) => {
          const pct = overallPct(u.id);
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="grid grid-cols-1 items-center gap-4 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[1.8fr_1.2fr_auto]"
            >
              <div className="flex items-center gap-3">
                <Avatar emoji={u.avatar} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink-900">
                      {u.name}
                    </span>
                    {u.status === "paused" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-ink-300">
                    {u.email} · joined {formatDate(u.joinedAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar pct={pct} className="flex-1" />
                <span className="flex w-12 items-center justify-end gap-1 text-sm font-semibold text-ink-700">
                  {pct === 100 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  )}
                  {pct}%
                </span>
              </div>
              <Link
                href={`/admin/${u.id}`}
                className="flex items-center gap-1 justify-self-start text-sm font-semibold text-brand-500 hover:underline sm:justify-self-end"
              >
                View <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">
        {icon && <Users className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold text-ink-900">
        {value}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
