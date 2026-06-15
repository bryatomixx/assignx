"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Settings2, Shield, XCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { relativeTime } from "@/lib/utils";

// ---- Toggle switch (peer/CSS pattern, accessible) ----
function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3"
    >
      <span className="relative inline-block h-6 w-11 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        {/* Track */}
        <span className="absolute inset-0 rounded-full bg-line transition-colors duration-200 peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 peer-focus-visible:ring-offset-1" />
        {/* Thumb */}
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
      <span className="text-sm font-medium text-ink-700">{label}</span>
    </label>
  );
}

// ---- Main moderation page ----
export default function ModerationPage() {
  const {
    ready,
    pendingPosts,
    approvePost,
    rejectPost,
    settings,
    setGlobalApproval,
    setAutoApprove,
    roleOf,
    canApprovePosts,
    canManageApproval,
  } = useBoard();
  const { currentUser, users } = useAcademy();

  if (!ready || !currentUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-ink-300">
          <Clock className="h-5 w-5 animate-spin" />
          Loading moderation...
        </div>
      </div>
    );
  }

  const userRole = roleOf(currentUser.id);
  const isAdmin = userRole === "admin";
  const canApprove = canApprovePosts();
  const canManage = canManageApproval();

  // Access gate: must be admin OR (mod with canApprovePosts or canManageApproval)
  if (!isAdmin && !canApprove && !canManage) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center">
          <Shield className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 font-semibold text-ink-900">
            You don&apos;t have access to moderation.
          </p>
          <Link
            href="/community"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[9px] border border-line px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to community
          </Link>
        </div>
      </div>
    );
  }

  const pending = pendingPosts();

  // Non-admin students eligible for per-member auto-approve toggle
  const members = users.filter((u) => u.role === "student");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
      >
        <ArrowLeft className="h-4 w-4" /> Community
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
          <Shield className="h-5 w-5 text-brand-500" />
        </span>
        <div>
          <h1 className="text-2xl">Moderation</h1>
          <p className="text-sm text-ink-500">Review pending posts and manage approval settings.</p>
        </div>
      </div>

      {/* Approval queue */}
      {canApprove && (
        <section className="mt-8" aria-label="Approval queue">
          <h2 className="mb-3 text-lg font-semibold text-ink-900">
            Pending posts
            {pending.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {pending.length}
              </span>
            )}
          </h2>

          {/* Live region so screen readers announce queue changes */}
          <div aria-live="polite" aria-atomic="false" className="flex flex-col gap-3">
            {pending.length === 0 ? (
              <div className="rounded-xl border border-line bg-white px-6 py-8 text-center text-ink-300">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" />
                <p className="text-sm font-medium">
                  You&apos;re all caught up. No posts waiting for review.
                </p>
              </div>
            ) : (
              pending.map((post) => {
                const author = users.find((u) => u.id === post.authorId);
                const role = roleOf(post.authorId);
                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-line bg-white p-4"
                  >
                    {/* Author row */}
                    <div className="flex items-center gap-3">
                      <Avatar emoji={author?.avatar ?? "?"} />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-ink-900">
                            {author?.name ?? "Unknown"}
                          </span>
                          <RoleBadge role={role} />
                        </div>
                        <span className="text-xs text-ink-300">
                          {relativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Body (truncated) */}
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-700 break-words">
                      {post.body}
                    </p>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => approvePost(post.id)}
                        aria-label={`Approve post by ${author?.name ?? "user"}`}
                        className="inline-flex items-center gap-2 rounded-[9px] gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_-6px_rgba(120,2,223,0.5)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => rejectPost(post.id)}
                        aria-label={`Reject post by ${author?.name ?? "user"}`}
                        className="inline-flex items-center gap-2 rounded-[9px] border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Approval settings (admin or canManageApproval mod) */}
      {canManage && (
        <section className="mt-8" aria-label="Approval settings">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-ink-500" />
            <h2 className="text-lg font-semibold text-ink-900">Approval settings</h2>
          </div>

          <div className="rounded-2xl border border-line bg-white divide-y divide-line overflow-hidden">
            {/* Global approval toggle */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">Require approval for all posts</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  When on, all new posts wait for a moderator before appearing in the feed.
                </p>
              </div>
              <Toggle
                id="global-approval"
                checked={settings.globalApproval}
                onChange={(v) => setGlobalApproval(v)}
                label=""
              />
            </div>

            {/* Per-member auto-approve */}
            {members.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-sm font-semibold text-ink-900 mb-3">
                  Auto-approve by member
                </p>
                <p className="text-xs text-ink-500 mb-4">
                  Members with this on bypass moderation even when global approval is required.
                </p>
                <ul className="flex flex-col gap-3">
                  {members.map((member) => {
                    const isAutoApproved = settings.autoApproveUserIds.includes(member.id);
                    return (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar emoji={member.avatar} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink-900">
                              {member.name}
                            </p>
                            <p className="truncate text-xs text-ink-500">{member.email}</p>
                          </div>
                        </div>
                        <Toggle
                          id={`auto-approve-${member.id}`}
                          checked={isAutoApproved}
                          onChange={(v) => setAutoApprove(member.id, v)}
                          label=""
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
