"use client";

import Link from "next/link";
import {
  Trophy,
  PenLine,
  MessageCircle,
  Heart,
  MessageSquare,
  Users,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LEVELS, POINTS } from "@/lib/community/gamification";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";

// Rows that explain how points are earned. Values come straight from the
// gamification POINTS constants so the panel never drifts from the rules.
const EARN_RULES: { icon: LucideIcon; label: string; pts: number }[] = [
  { icon: PenLine, label: "Publish a post", pts: POINTS.post },
  { icon: MessageCircle, label: "Write a comment", pts: POINTS.comment },
  { icon: Heart, label: "Get a like on your post", pts: POINTS.likeReceived },
  { icon: MessageSquare, label: "Get a comment on your post", pts: POINTS.commentReceived },
  { icon: Users, label: "Gain a follower", pts: POINTS.follower },
];

export function GamificationPanel() {
  const { gamificationFor } = useBoard();
  const { currentUser } = useAcademy();

  if (!currentUser) return null;

  const gami = gamificationFor(currentUser.id);

  const levelDef = LEVELS.find((l) => l.level === gami.level);
  const levelMin = levelDef?.min ?? 0;
  const nextLevel =
    gami.nextAt !== null ? LEVELS.find((l) => l.min === gami.nextAt) : null;

  const progressPct =
    gami.nextAt !== null
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((gami.points - levelMin) / (gami.nextAt - levelMin)) * 100),
          ),
        )
      : 100;

  const toNext = gami.nextAt !== null ? gami.nextAt - gami.points : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Your progress */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Your progress
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
            {gami.levelName}
          </span>
          <span className="font-display text-2xl font-semibold text-ink-900">
            {gami.points}
            <span className="ml-1 text-sm font-medium text-ink-400">pts</span>
          </span>
        </div>

        {/* Level progress bar */}
        <div className="mt-4">
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
          <p className="mt-1.5 text-xs text-ink-400">
            {gami.nextAt !== null ? (
              <>
                {toNext} pts to{" "}
                <span className="font-semibold text-ink-700">
                  {nextLevel?.name ?? "next level"}
                </span>
              </>
            ) : (
              <span className="font-semibold text-amber-600">Max level reached</span>
            )}
          </p>
        </div>

        <Link
          href={`/community/members/${currentUser.id}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
        >
          View your badges
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* How to earn points */}
      <div className="card p-5">
        <h2 className="mb-3 text-base font-semibold text-ink-900">
          How to earn points
        </h2>
        <ul className="flex flex-col gap-2.5">
          {EARN_RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <li
                key={rule.label}
                className="flex items-center gap-3 text-sm text-ink-700"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">{rule.label}</span>
                <span className="shrink-0 font-semibold text-brand-500">
                  +{rule.pts}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
