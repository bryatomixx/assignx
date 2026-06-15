"use client";

import { useParams } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { PostCard } from "@/components/community/PostCard";
import { BADGE_ICON_MAP } from "@/components/community/TopContributors";
import { LEVELS } from "@/lib/community/gamification";
import { ALL_BADGES } from "@/lib/community/gamification";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const {
    ready,
    feed,
    followerCount,
    followingCount,
    approvedPostCountBy,
    follow,
    unfollow,
    isFollowing,
    roleOf,
    gamificationFor,
  } = useBoard();
  const { currentUser, users, isPaused } = useAcademy();

  if (!ready || !currentUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="text-ink-300">Loading profile...</div>
      </div>
    );
  }

  const member = users.find((u) => u.id === memberId);

  if (!member) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-line bg-white px-6 py-10 text-center text-ink-300">
          Member not found.
        </div>
      </div>
    );
  }

  const isSelf = currentUser.id === memberId;
  const role = roleOf(memberId);
  const following = isFollowing(memberId);
  const paused = isPaused();

  // Only approved posts by this author
  const posts = feed("all").filter((p) => p.authorId === memberId);

  // Gamification
  const gami = gamificationFor(memberId);
  const earnedBadgeIds = new Set(gami.badges.map((b) => b.id));

  // Compute level min for the progress bar
  const levelDef = LEVELS.find((l) => l.level === gami.level);
  const levelMin = levelDef?.min ?? 0;
  const progressPct =
    gami.nextAt !== null
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((gami.points - levelMin) / (gami.nextAt - levelMin)) * 100,
            ),
          ),
        )
      : 100;

  function handleFollow() {
    if (paused || isSelf) return;
    if (following) {
      unfollow(memberId);
    } else {
      follow(memberId);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar emoji={member.avatar} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl">{member.name}</h1>
              <RoleBadge role={role} />
              {/* Level chip */}
              <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                {gami.levelName}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-ink-300 capitalize">{member.role}</p>

            {/* Stats row */}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold text-ink-900">
                  {followerCount(memberId)}
                </span>
                <span className="text-xs text-ink-400">Followers</span>
              </div>
              <div className="h-8 w-px bg-line hidden sm:block" />
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold text-ink-900">
                  {followingCount(memberId)}
                </span>
                <span className="text-xs text-ink-400">Following</span>
              </div>
              <div className="h-8 w-px bg-line hidden sm:block" />
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold text-ink-900">
                  {approvedPostCountBy(memberId)}
                </span>
                <span className="text-xs text-ink-400">Posts</span>
              </div>
              <div className="h-8 w-px bg-line hidden sm:block" />
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold text-ink-900">
                  {gami.points}
                </span>
                <span className="text-xs text-ink-400">Points</span>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-ink-400">
                <span>{gami.levelName}</span>
                {gami.nextAt !== null ? (
                  <span>{gami.points} / {gami.nextAt} pts</span>
                ) : (
                  <span className="font-semibold text-amber-600">Max level</span>
                )}
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Level progress: ${progressPct}%`}
              >
                <div
                  className="h-full rounded-full gradient-brand transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Follow / Following button */}
          {!isSelf && (
            <button
              onClick={handleFollow}
              disabled={paused}
              aria-label={
                following
                  ? `Unfollow ${member.name}`
                  : `Follow ${member.name}`
              }
              aria-disabled={paused}
              title={paused ? "Reactivate your account to interact" : undefined}
              className={cn(
                "flex min-h-[44px] items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                following
                  ? "border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100"
                  : "border-line bg-white text-ink-700 hover:bg-surface-2",
                paused && "cursor-not-allowed opacity-50",
              )}
            >
              {following ? (
                <UserCheck className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="card mt-5 p-5">
        <h2 className="mb-3 text-base font-semibold text-ink-900">Badges</h2>
        {ALL_BADGES.length === 0 ? (
          <p className="text-sm text-ink-300">No badges defined.</p>
        ) : (
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            aria-label="Badges"
          >
            {ALL_BADGES.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              const IconComponent = BADGE_ICON_MAP[badge.icon];
              return (
                <li key={badge.id}>
                  <div
                    title={badge.description}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                      earned
                        ? "border-amber-200 bg-amber-50"
                        : "border-line bg-surface-2 opacity-40",
                    )}
                  >
                    {IconComponent ? (
                      <IconComponent
                        className={cn(
                          "h-4 w-4 shrink-0",
                          earned ? "text-amber-600" : "text-ink-400",
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-xs font-semibold",
                          earned ? "text-amber-800" : "text-ink-500",
                        )}
                      >
                        {badge.label}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Posts */}
      <section aria-label={`Posts by ${member.name}`} className="mt-6 flex flex-col gap-4">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-line bg-white px-6 py-10 text-center text-ink-300">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>
    </div>
  );
}
