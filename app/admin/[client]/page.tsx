"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  LockOpen,
  Trash2,
  Pause,
  Play,
  Bell,
  ClipboardCheck,
} from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { hasHomework } from "@/lib/mock/modules";
import { formatDate, cn } from "@/lib/utils";

function ClientDetail() {
  const { client: clientId } = useParams<{ client: string }>();
  const router = useRouter();
  const {
    users,
    modules,
    moduleProgress,
    overallPct,
    completedFor,
    canAccess,
    unlockModule,
    lockModule,
    unlockAll,
    lockAll,
    setStatus,
    removeUser,
    isHomeworkDone,
    setHomeworkDone,
  } = useAcademy();

  const user = users.find((u) => u.id === clientId);
  if (!user) return <div className="p-8 text-ink-300">Partner not found.</div>;

  const done = completedFor(user.id);
  const paidModules = modules.filter((m) => m.access === "paid");
  const paused = user.status === "paused";

  const handleRemove = () => {
    if (
      window.confirm(`Remove ${user.name}? This deletes their partner account.`)
    ) {
      removeUser(user.id);
      router.push("/admin");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Partners
      </Link>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-3xl border border-line bg-white p-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar emoji={user.avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl">{user.name}</h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                  paused
                    ? "bg-amber-100 text-amber-700"
                    : "bg-success/10 text-success",
                )}
              >
                {paused ? "Paused" : "Active"}
              </span>
            </div>
            <p className="text-sm text-ink-500">
              {user.email} · joined {formatDate(user.joinedAt)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-900">Overall</span>
          <ProgressBar pct={overallPct(user.id)} showLabel className="flex-1" />
        </div>

        {/* Admin actions */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
          <button
            onClick={() => setStatus(user.id, paused ? "active" : "paused")}
            className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-surface-2"
          >
            {paused ? (
              <>
                <Play className="h-4 w-4 text-success" /> Reactivate
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-amber-600" /> Pause access
              </>
            )}
          </button>
          <button
            onClick={handleRemove}
            className="inline-flex items-center gap-2 rounded-[9px] border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Remove partner
          </button>
        </div>
      </motion.div>

      {/* Course access */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">Course access</h2>
        <div className="flex gap-2">
          <button
            onClick={() => unlockAll(user.id)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-500 hover:bg-brand-50"
          >
            Unlock all
          </button>
          <button
            onClick={() => lockAll(user.id)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-surface-2"
          >
            Lock all
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {/* Free module — always on */}
        {modules
          .filter((m) => m.access === "free")
          .map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                style={{ backgroundImage: m.accent }}
              >
                <m.Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
              </span>
              <span className="flex-1 truncate font-medium text-ink-900">
                {m.title}
              </span>
              <span className="text-xs font-semibold text-ink-300">
                Free · always on
              </span>
            </div>
          ))}

        {/* Paid modules — toggle access */}
        {paidModules.map((m) => {
          const unlocked = canAccess(m, user.id);
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                style={{ backgroundImage: m.accent }}
              >
                <m.Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
              </span>
              <span className="flex-1 truncate font-medium text-ink-900">
                {m.title}
              </span>
              <button
                onClick={() =>
                  unlocked ? lockModule(user.id, m.id) : unlockModule(user.id, m.id)
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  unlocked
                    ? "gradient-brand text-white"
                    : "border border-line text-ink-500 hover:bg-surface-2",
                )}
              >
                {unlocked ? (
                  <>
                    <LockOpen className="h-4 w-4" /> Unlocked
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Locked
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Per-module progress */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink-900">
        Progress by module
      </h2>
      <div className="flex flex-col gap-4">
        {modules.map((m) => {
          const prog = moduleProgress(m.id, user.id);
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundImage: m.accent }}
                >
                  <m.Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="truncate font-semibold text-ink-900">
                    {m.title}
                  </span>
                  <span className="block text-xs text-ink-300">
                    {prog.completed}/{prog.total} lessons
                  </span>
                </div>
                <span className="text-sm font-semibold text-ink-700">
                  {prog.pct}%
                </span>
              </div>
              <ProgressBar pct={prog.pct} className="mt-3" />

              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {m.lessons.map((l) => {
                  const complete = done.includes(l.id);
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 text-xs text-ink-500"
                    >
                      {complete ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                      )}
                      <span className="truncate">{l.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Homework status */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink-900">Homework</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {modules
          .flatMap((m) => m.lessons.filter(hasHomework))
          .map((l) => {
            const hw = isHomeworkDone(l.id, user.id);
            return (
              <div
                key={l.id}
                className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0"
              >
                <ClipboardCheck
                  className={cn(
                    "h-4 w-4 shrink-0",
                    hw ? "text-success" : "text-ink-300",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {l.title}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      hw ? "text-success" : "text-amber-600",
                    )}
                  >
                    {hw ? "Done" : "Pending"}
                  </span>
                </div>
                <button
                  onClick={() => setHomeworkDone(user.id, l.id, !hw)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-surface-2"
                >
                  {hw ? "Mark undone" : "Mark done"}
                </button>
                {/* Decorative — does not send anything yet */}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-surface-2"
                  title="Reminders are not wired up yet"
                >
                  <Bell className="h-3.5 w-3.5" /> Send reminder
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function AdminClientPage() {
  return (
    <AdminGuard>
      <ClientDetail />
    </AdminGuard>
  );
}
