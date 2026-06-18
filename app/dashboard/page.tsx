"use client";

// Next.js 16 App Router -- client component (hooks: useAcademy, useBoard).
// Docs read: 01-app/01-getting-started/05-server-and-client-components.md

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  CheckCircle2,
  PauseCircle,
  MessageSquare,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Flag,
  Trophy,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { useBoard } from "@/lib/store/BoardProvider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate, relativeTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Stat card (reusing same pattern as app/admin/page.tsx)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon?: React.ElementType;
  accent?: "brand" | "amber" | "success" | "magenta";
}) {
  const iconColor =
    accent === "amber"
      ? "text-amber-500"
      : accent === "success"
        ? "text-success"
        : accent === "magenta"
          ? "text-magenta"
          : "text-brand-500";

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">
        {Icon && <Icon className={`h-3.5 w-3.5 ${iconColor}`} />}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold text-ink-900">
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick-access card link
// ---------------------------------------------------------------------------

function QuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-white">
        <Icon className="h-4 w-4 text-brand-500" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink-900">{label}</div>
        <div className="mt-0.5 text-xs text-ink-400">{description}</div>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-colors group-hover:text-brand-500" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHead({ title }: { title: string }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-ink-700">{title}</h2>
  );
}

// ---------------------------------------------------------------------------
// Inner dashboard (shown only to admins via AdminGuard)
// ---------------------------------------------------------------------------

function DashboardContent() {
  const { currentUser, users, overallPct } = useAcademy();
  const {
    feed,
    pendingPosts,
    approvedPosts,
    leaderboard,
    gamificationFor,
  } = useBoard();

  // ---- Partner stats ----
  const students = users.filter((u) => u.role === "student");
  const totalPartners = students.length;
  const completedPartners = students.filter(
    (u) => overallPct(u.id) === 100,
  ).length;
  const activePartners = students.filter((u) => {
    const p = overallPct(u.id);
    return p > 0 && p < 100;
  }).length;
  const pausedPartners = students.filter(
    (u) => u.status === "paused",
  ).length;

  // ---- Community stats ----
  const allApproved = approvedPosts();
  const pendingCount = pendingPosts().length;
  const totalMembers = users.length;

  // ---- Partners needing attention: paused + 0% starters ----
  const pausedList = students
    .filter((u) => u.status === "paused")
    .slice(0, 3);
  const stuckList = students
    .filter((u) => u.status !== "paused" && overallPct(u.id) === 0)
    .slice(0, 3);
  const attentionList = [...pausedList, ...stuckList].slice(0, 5);

  // ---- Recent activity: top 5 approved posts sorted newest first ----
  const recentPosts = [...allApproved]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // ---- Top weekly contributors ----
  const weeklyLeaders = leaderboard("week").slice(0, 5);

  // ---- Admin name for greeting ----
  const adminName = currentUser?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Admin
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Dashboard</h1>
        <p className="mt-1 text-ink-500">
          Welcome back, {adminName}. Here is your academy at a glance.
        </p>
      </motion.div>

      {/* Partner stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <StatCard
          label="Total partners"
          value={totalPartners}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Active"
          value={activePartners}
          icon={Activity}
          accent="magenta"
        />
        <StatCard
          label="Completed"
          value={completedPartners}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Paused"
          value={pausedPartners}
          icon={PauseCircle}
          accent="amber"
        />
      </motion.div>

      {/* Two-column grid (stacks on mobile) */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* LEFT column */}
        <div className="flex flex-col gap-8">
          {/* Community snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <SectionHead title="Community snapshot" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                label="Approved posts"
                value={allApproved.length}
                icon={MessageSquare}
              />
              <StatCard
                label="Members"
                value={totalMembers}
                icon={Users}
              />
              {pendingCount > 0 ? (
                <Link
                  href="/community/moderation"
                  className="group flex flex-col justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 transition-colors hover:border-amber-500"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
                    <Flag className="h-3.5 w-3.5" />
                    Pending
                  </div>
                  <div className="mt-1 font-display text-3xl font-semibold text-amber-700">
                    {pendingCount}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600 group-hover:underline">
                    Review queue <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ) : (
                <StatCard
                  label="Pending review"
                  value={0}
                  icon={Flag}
                  accent="success"
                />
              )}
            </div>
          </motion.div>

          {/* Partners needing attention */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <SectionHead title="Partners needing attention" />
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {attentionList.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <p className="text-sm text-ink-500">
                    All partners are progressing well.
                  </p>
                </div>
              ) : (
                attentionList.map((u, i) => {
                  const pct = overallPct(u.id);
                  const isPaused = u.status === "paused";
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.18 + i * 0.05 }}
                      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
                    >
                      <Avatar emoji={u.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-ink-900">
                            {u.name}
                          </span>
                          {isPaused ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              Paused
                            </span>
                          ) : (
                            <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                              Not started
                            </span>
                          )}
                        </div>
                        <ProgressBar pct={pct} className="mt-1.5" />
                      </div>
                      <Link
                        href={`/admin/${u.id}`}
                        className="flex items-center gap-0.5 text-xs font-semibold text-brand-500 hover:underline"
                      >
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Quick access */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <SectionHead title="Quick access" />
            <div className="flex flex-col gap-3">
              <QuickLink
                href="/admin"
                label="Partners"
                description="View progress for all agency partners"
                icon={Users}
              />
              <QuickLink
                href="/admin/audit-log"
                label="Audit log"
                description="Review all admin actions and changes"
                icon={ShieldCheck}
              />
              <QuickLink
                href="/community/moderation"
                label="Moderation"
                description="Approve or reject pending community posts"
                icon={Flag}
              />
              <QuickLink
                href="/admin/events"
                label="Events"
                description="Create the events shown in the sidebar"
                icon={CalendarClock}
              />
            </div>
          </motion.div>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-8">
          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
          >
            <SectionHead title="Recent community posts" />
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-ink-200" />
                  <p className="text-sm text-ink-500">
                    No approved posts yet.
                  </p>
                </div>
              ) : (
                recentPosts.map((post, i) => {
                  const author = users.find((u) => u.id === post.authorId);
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}
                      className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0"
                    >
                      <Avatar emoji={author?.avatar ?? "🙂"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-ink-900">
                          {post.body}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                          <span className="font-medium">
                            {author?.name ?? "Unknown"}
                          </span>
                          <span>·</span>
                          <span>{relativeTime(post.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Top weekly contributors */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.17 }}
          >
            <SectionHead title="Top contributors this week" />
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {weeklyLeaders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                  <Trophy className="h-8 w-8 text-ink-200" />
                  <p className="text-sm text-ink-500">
                    No activity this week yet.
                  </p>
                </div>
              ) : (
                weeklyLeaders.map((entry, i) => {
                  const user = users.find((u) => u.id === entry.userId);
                  const { levelName } = gamificationFor(entry.userId);
                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.25 + i * 0.05 }}
                      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
                    >
                      {/* Rank */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs font-bold text-ink-400">
                        {i === 0 ? (
                          <Trophy className="h-4 w-4 text-amber-500" />
                        ) : (
                          `#${i + 1}`
                        )}
                      </span>
                      <Avatar emoji={user?.avatar ?? "🙂"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink-900">
                          {user?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-ink-400">{levelName}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-brand-500">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {entry.points}
                        <span className="text-xs font-normal text-ink-400">
                          pts
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Attention summary banner (shown if there are stuck or paused partners) */}
          {attentionList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22 }}
              className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {attentionList.length}{" "}
                  {attentionList.length === 1 ? "partner" : "partners"} may
                  need a check-in.
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Review paused or not-started accounts and reach out to keep
                  them on track.
                </p>
                <Link
                  href="/admin"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
                >
                  Go to Partners <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export: wrapped in AdminGuard (same pattern as app/admin/page.tsx)
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
