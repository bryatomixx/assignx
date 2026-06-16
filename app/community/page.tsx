"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Shield, Trash2, Users2 } from "lucide-react";
import { PostComposer } from "@/components/community/PostComposer";
import { PostCard } from "@/components/community/PostCard";
import { TopContributors } from "@/components/community/TopContributors";
import { GamificationPanel } from "@/components/community/GamificationPanel";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

type Tab = "all" | "following";

export default function CommunityPage() {
  const { ready, feed, myPendingPosts, myRejectedPosts, deletePost, pendingPosts, canApprovePosts, canManageApproval } = useBoard();
  const { currentUser } = useAcademy();

  const [tab, setTab] = useState<Tab>("all");
  const [showPending, setShowPending] = useState(false);

  if (!ready || !currentUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-ink-300">
          <Clock className="h-5 w-5 animate-spin" />
          Loading community...
        </div>
      </div>
    );
  }

  const pending = myPendingPosts();
  const rejected = myRejectedPosts();
  const posts = feed(tab);
  const pendingCount = pendingPosts().length;
  const showModLink = canApprovePosts() || canManageApproval();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page heading (full width) */}
      <div className="mb-6 flex items-center gap-2">
        <Users2 className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl flex-1">Community</h1>
        {showModLink && (
          <Link
            href="/community/moderation"
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label={`Moderation${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`}
          >
            <Shield className="h-4 w-4 text-brand-500" />
            Moderation
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                {pendingCount}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* 3-column layout: left rail (gamification), center feed, right rail
          (top contributors). On mobile everything stacks with the feed first. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* Center feed */}
        <div className="min-w-0">
          {/* Post composer */}
          <PostComposer />

          {/* Banners */}
          <div aria-live="polite" className="mt-4 flex flex-col gap-3">
        {/* Pending posts banner */}
        {pending.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Your post is pending review. We will notify you once it is approved.
                </p>
              </div>
              <button
                onClick={() => setShowPending((v) => !v)}
                className="text-sm font-semibold text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
              >
                {showPending ? "Hide" : `See my pending posts (${pending.length})`}
              </button>
            </div>

            {showPending && (
              <ul className="mt-3 flex flex-col gap-3">
                {pending.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-xl border border-amber-200 bg-white p-3 text-sm text-ink-700"
                  >
                    <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      <Clock className="h-3 w-3" />
                      Pending approval
                    </div>
                    <p className="break-words">{post.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Rejected posts banner */}
        {rejected.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-red-800">
                  One of your posts was not approved.
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {rejected.map((post) => (
                    <li
                      key={post.id}
                      className="flex items-start justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm text-ink-700"
                    >
                      <p className="break-words flex-1 line-clamp-2">{post.body}</p>
                      <button
                        onClick={() => deletePost(post.id)}
                        aria-label="Delete rejected post"
                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Community feed filter"
        className="mt-5 flex gap-1 rounded-xl bg-surface-3 p-1"
      >
        {(["all", "following"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
              tab === t
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-900",
            )}
          >
            {t === "all" ? "All" : "Following"}
          </button>
        ))}
      </div>

      {/* Feed */}
      <section
        role="tabpanel"
        aria-label={tab === "all" ? "All posts" : "Posts from people you follow"}
        className="mt-4 flex flex-col gap-4"
      >
        {posts.length === 0 ? (
          <div className="rounded-xl border border-line bg-white px-6 py-10 text-center text-ink-300">
            {tab === "all"
              ? "Nothing here yet. Be the first to post."
              : "You are not following anyone yet. Browse members to get started."}
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>
        </div>

        {/* Right rail: top contributors, with your progress below it */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <TopContributors />
          <GamificationPanel />
        </aside>
      </div>
    </div>
  );
}
