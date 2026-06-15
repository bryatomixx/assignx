"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Heart,
  Medal,
  MessageCircle,
  PenLine,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

// Map of badge icon names (from gamification.ts) to lucide components.
export const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  PenLine,
  MessageCircle,
  Heart,
  Users,
  Sparkles,
  Crown,
};

type Range = "all" | "week";

function RankLabel({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        aria-label="Rank 1"
        className="flex h-7 w-7 items-center justify-center"
      >
        <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        aria-label="Rank 2"
        className="flex h-7 w-7 items-center justify-center"
      >
        <Medal className="h-5 w-5 text-ink-400" aria-hidden="true" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        aria-label="Rank 3"
        className="flex h-7 w-7 items-center justify-center"
      >
        <Medal className="h-5 w-5 text-amber-700" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      aria-label={`Rank ${rank}`}
      className="flex h-7 w-7 items-center justify-center text-sm font-semibold text-ink-400"
    >
      {rank}
    </span>
  );
}

export function TopContributors() {
  const [range, setRange] = useState<Range>("all");
  const { leaderboard, roleOf } = useBoard();
  const { users } = useAcademy();

  const entries = leaderboard(range).slice(0, 5);

  return (
    <div className="card rounded-3xl p-5">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">
          Top contributors
        </h2>

        {/* Range toggle */}
        <div
          role="tablist"
          aria-label="Leaderboard time range"
          className="flex gap-1 rounded-xl bg-surface-3 p-1"
        >
          {(["all", "week"] as Range[]).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                range === r
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-900",
              )}
            >
              {r === "all" ? "All time" : "This week"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-300">
          No activity yet this week.
        </p>
      ) : (
        <ol className="flex flex-col gap-2" aria-label="Contributor leaderboard">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const user = users.find((u) => u.id === entry.userId);
            const role = roleOf(entry.userId);

            return (
              <li key={entry.userId}>
                <Link
                  href={`/community/members/${entry.userId}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  aria-label={`${user?.name ?? "Unknown"}, rank ${rank}, ${entry.points} points`}
                >
                  <RankLabel rank={rank} />

                  <Avatar
                    emoji={user?.avatar ?? "?"}
                    size="sm"
                    className="shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-ink-900">
                        {user?.name ?? "Unknown"}
                      </span>
                      <RoleBadge role={role} />
                    </div>
                    <span className="text-xs text-ink-400">
                      {entry.levelName}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-brand-500">
                    {entry.points} pts
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
