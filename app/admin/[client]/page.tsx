"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileText,
  Heart,
  Lock,
  LockOpen,
  MessageCircle,
  Pause,
  Play,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { useBoard } from "@/lib/store/BoardProvider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { getLessonClips, hasHomework } from "@/lib/mock/modules";
import { formatDate, cn } from "@/lib/utils";
import type { ModPermissions } from "@/lib/types";

// ---- Stat card for community activity grid ----
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-4">
      <Icon className="h-5 w-5 text-ink-500" />
      <span className="font-display text-2xl font-semibold text-ink-900">{value}</span>
      <span className="text-xs font-medium text-ink-500">{label}</span>
    </div>
  );
}

// ---- Accessible inline remove confirmation dialog ----
function RemovePanel({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="remove-title"
      aria-describedby="remove-desc"
      className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-5"
    >
      <h3 id="remove-title" className="text-base font-semibold text-red-800">
        Remove {name} from AssignX Academy?
      </h3>
      <p id="remove-desc" className="mt-2 text-sm text-red-700">
        This will permanently delete their account, all posts, comments, likes, and follows.
        This cannot be undone.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={onCancel}
          className="rounded-[9px] border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-[9px] bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Yes, remove partner
        </button>
      </div>
    </div>
  );
}

// ---- Main detail view (all hooks at top, no early returns before hooks) ----
function ClientDetail() {
  const { client: clientId } = useParams<{ client: string }>();
  const router = useRouter();

  // Academy context
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
    videoProgressFor,
  } = useAcademy();

  // Board context (community stats + mod management)
  const {
    postCountBy,
    commentsBy,
    likesGivenBy,
    followerCount,
    followingCount,
    roleOf,
    getMod,
    isMod,
    promoteMod,
    demoteMod,
    setModPermission,
    purgeUser,
  } = useBoard();

  // UI state (all hooks before any conditional return)
  const [showRemovePanel, setShowRemovePanel] = useState(false);
  const [promoteConfirm, setPromoteConfirm] = useState(false);
  const [demoteConfirm, setDemoteConfirm] = useState(false);

  const user = users.find((u) => u.id === clientId);
  if (!user) return <div className="p-8 text-ink-300">Partner not found.</div>;

  const done = completedFor(user.id);
  const paidModules = modules.filter((m) => m.access === "paid");
  const paused = user.status === "paused";

  // Community role data
  const communityRole = roleOf(user.id);
  const modPerms = getMod(user.id);
  const userIsMod = isMod(user.id);

  const MOD_PERMISSION_LABELS: { key: keyof ModPermissions; label: string }[] = [
    { key: "canApprovePosts", label: "Approve posts" },
    { key: "canDeletePosts", label: "Delete posts" },
    { key: "canDeleteComments", label: "Delete comments" },
    { key: "canPinContent", label: "Pin content" },
    { key: "canManageApproval", label: "Manage approval settings" },
  ];

  // user is guaranteed non-null here (early return above handles undefined case).
  // We capture the id in a const so the inner function body has a narrowed type.
  const userId = user.id;

  function handleRemoveConfirm() {
    // Cascade: purge all board data (posts, comments, likes, follows, mod entry),
    // then remove from academy users list.
    purgeUser(userId);
    removeUser(userId);
    router.push("/admin");
  }

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
            onClick={() => {
              setShowRemovePanel((v) => !v);
              setPromoteConfirm(false);
              setDemoteConfirm(false);
            }}
            className="inline-flex items-center gap-2 rounded-[9px] border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Remove partner
          </button>
        </div>

        {/* Inline remove confirmation (replaces window.confirm) */}
        {showRemovePanel && (
          <RemovePanel
            name={user.name}
            onConfirm={handleRemoveConfirm}
            onCancel={() => setShowRemovePanel(false)}
          />
        )}
      </motion.div>

      {/* Community activity */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink-900">Community activity</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={FileText} label="Posts" value={postCountBy(user.id)} />
        <StatCard icon={MessageCircle} label="Comments" value={commentsBy(user.id).length} />
        <StatCard icon={Heart} label="Likes given" value={likesGivenBy(user.id).length} />
        <StatCard icon={Users} label="Followers" value={followerCount(user.id)} />
        <StatCard icon={Users} label="Following" value={followingCount(user.id)} />
      </div>

      {/* Community role management (page is already under AdminGuard) */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink-900">Community role</h2>
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 shrink-0 text-ink-500" />
            <div>
              <p className="text-sm font-semibold text-ink-900">Current role</p>
              <div className="mt-1 flex items-center gap-1.5">
                <RoleBadge role={communityRole} />
                {communityRole === "student" && (
                  <span className="text-sm text-ink-500">Member</span>
                )}
              </div>
            </div>
          </div>

          {/* Promote / demote actions with inline confirmation */}
          <div className="flex items-center gap-2">
            {!userIsMod ? (
              !promoteConfirm ? (
                <button
                  onClick={() => { setPromoteConfirm(true); setDemoteConfirm(false); }}
                  className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  <Shield className="h-4 w-4 text-brand-500" />
                  Promote to Mod
                </button>
              ) : (
                <div className="flex items-center gap-2" role="group" aria-label="Confirm promotion">
                  <span className="text-sm text-ink-500">Confirm?</span>
                  <button
                    onClick={() => { promoteMod(user.id); setPromoteConfirm(false); }}
                    className="rounded-[9px] gradient-brand px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    Yes, promote
                  </button>
                  <button
                    onClick={() => setPromoteConfirm(false)}
                    className="rounded-[9px] border border-line px-3 py-1.5 text-sm font-semibold text-ink-700 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              !demoteConfirm ? (
                <button
                  onClick={() => { setDemoteConfirm(true); setPromoteConfirm(false); }}
                  className="inline-flex items-center gap-2 rounded-[9px] border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Remove mod role
                </button>
              ) : (
                <div className="flex items-center gap-2" role="group" aria-label="Confirm demotion">
                  <span className="text-sm text-ink-500">Confirm?</span>
                  <button
                    onClick={() => { demoteMod(user.id); setDemoteConfirm(false); }}
                    className="rounded-[9px] bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Yes, remove
                  </button>
                  <button
                    onClick={() => setDemoteConfirm(false)}
                    className="rounded-[9px] border border-line px-3 py-1.5 text-sm font-semibold text-ink-700 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mod permission checkboxes (visible only when user is a mod) */}
        {userIsMod && modPerms && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-3 text-sm font-semibold text-ink-900">Moderator permissions</p>
            <ul className="flex flex-col gap-3">
              {MOD_PERMISSION_LABELS.map(({ key, label }) => {
                const checked = modPerms[key];
                return (
                  <li key={key} className="flex items-center justify-between gap-4">
                    <label
                      htmlFor={`perm-${key}`}
                      className="flex-1 text-sm font-medium text-ink-700"
                    >
                      {label}
                    </label>
                    <input
                      id={`perm-${key}`}
                      type="checkbox"
                      role="switch"
                      aria-checked={checked}
                      checked={checked}
                      onChange={(e) => setModPermission(user.id, key, e.target.checked)}
                      className="h-4 w-4 rounded accent-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

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
        {/* Free module, always on */}
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

        {/* Paid modules, toggle access */}
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

      {/* Per-module progress with per-clip video progress */}
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

              {/* Per-lesson: completion + video progress ("watched up to") */}
              <div className="mt-3 flex flex-col gap-3">
                {m.lessons.map((l) => {
                  const complete = done.includes(l.id);
                  const clips = getLessonClips(l);
                  const vpList = videoProgressFor(user.id, l.id);

                  return (
                    <div key={l.id}>
                      {/* Lesson completion status */}
                      <div className="flex items-center gap-2 text-xs text-ink-500">
                        {complete ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                        )}
                        <span className="truncate font-medium text-ink-700">{l.title}</span>
                      </div>

                      {/* Per-clip video progress (distinct from "completed") */}
                      <div className="ml-5 mt-1.5 flex flex-col gap-1.5">
                        {clips.map((clip, clipIdx) => {
                          const vp = vpList.find((v) => v.clipIndex === clipIdx);
                          if (!vp) {
                            return (
                              <div key={clip.id} className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-medium text-ink-400 truncate">{clip.title}:</span>
                                <span className="text-ink-300">Not started</span>
                              </div>
                            );
                          }
                          const pct = Math.min(
                            Math.round((vp.elapsedSec / vp.durationSec) * 100),
                            100,
                          );
                          return (
                            <div key={clip.id} className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-medium text-ink-500 truncate">
                                {clip.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                                  <div
                                    className="h-full rounded-full bg-indigo-400"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="shrink-0 text-[11px] tabular-nums text-ink-500">
                                  {Math.round(vp.elapsedSec)}s / {vp.durationSec}s ({pct}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                {/* Decorative, does not send anything yet */}
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
