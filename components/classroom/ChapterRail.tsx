"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CirclePlay,
  ListChecks,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/lib/types";

// ---- Status icon per row ----
type RowStatus = "playing" | "done" | "pending";

function StatusIcon({ status, index }: { status: RowStatus; index: number }) {
  if (status === "playing") {
    return (
      <Loader2
        className="h-4 w-4 shrink-0 text-brand-500 animate-spin"
        aria-hidden="true"
      />
    );
  }
  if (status === "done") {
    return (
      <Check
        className="h-4 w-4 shrink-0 text-success"
        aria-hidden="true"
        strokeWidth={2.5}
      />
    );
  }
  return (
    <span className="relative h-4 w-4 shrink-0 flex items-center justify-center">
      <CirclePlay className="h-4 w-4 text-ink-300" aria-hidden="true" />
      <span className="sr-only">{index + 1}</span>
    </span>
  );
}

// ---- Tiny badge marking that a chapter carries a task ----
function TaskBadge({ type }: { type: "text" | "video" }) {
  const Icon = type === "video" ? PlayCircle : ListChecks;
  return (
    <span
      title={type === "video" ? "Video task" : "Task"}
      className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-500"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {type === "video" ? "Video task" : "Task"}
    </span>
  );
}

// ---- Single chapter row ----
function ChapterRow({
  chapter,
  index,
  status,
  taskDone,
  onSelect,
}: {
  chapter: Chapter;
  index: number;
  status: RowStatus;
  taskDone: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={status === "playing" ? "true" : undefined}
        className={cn(
          "w-full text-left rounded-xl px-3 py-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500",
          status === "playing"
            ? "bg-brand-50 border-l-2 border-brand-500 pl-[10px]"
            : "hover:bg-surface-3 border-l-2 border-transparent pl-[10px]",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <StatusIcon status={status} index={index} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm leading-snug",
                status === "playing"
                  ? "font-semibold text-brand-500"
                  : status === "done"
                    ? "text-ink-500"
                    : "text-ink-700 font-medium",
              )}
            >
              {chapter.title}
            </p>
            {chapter.task && (
              <div className="mt-1 flex items-center gap-1.5">
                <TaskBadge type={chapter.task.type} />
                {taskDone && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
                    <Check className="h-3 w-3" strokeWidth={2.5} /> done
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ---- Public component ----
export interface ChapterRailProps {
  /** Heading shown above the list (defaults to "What you'll cover"). */
  heading?: string;
  chapters: Chapter[];
  /** Index of the chapter currently selected / playing. */
  currentIndex: number;
  /** Indices of chapters whose video has been fully watched. */
  watchedIndices: Set<number>;
  /** Indices of chapters whose task has been marked done. */
  taskDoneIndices: Set<number>;
  /** Called when the user clicks a chapter. */
  onSelect: (index: number) => void;
  /** Bottom-of-rail navigation: next lesson (or back to module on the last one). */
  next?: { href: string; label: string };
}

export function ChapterRail({
  heading = "What you'll cover",
  chapters,
  currentIndex,
  watchedIndices,
  taskDoneIndices,
  onSelect,
  next,
}: ChapterRailProps) {
  return (
    <nav
      aria-label="Chapters"
      className="rounded-2xl border border-line bg-white p-4"
    >
      <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-brand-500">
        {heading}
      </h3>
      <ul className="flex flex-col gap-0.5">
        {chapters.map((chapter, i) => {
          const status: RowStatus =
            i === currentIndex
              ? "playing"
              : watchedIndices.has(i)
                ? "done"
                : "pending";
          return (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              index={i}
              status={status}
              taskDone={taskDoneIndices.has(i)}
              onSelect={() => onSelect(i)}
            />
          );
        })}
      </ul>

      {/* Bottom-of-rail navigation to the next lesson (or back to module). */}
      {next && (
        <div className="mt-3 border-t border-line pt-3">
          <Link
            href={next.href}
            className="gradient-brand flex items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(120,2,223,0.6)] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            {next.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </nav>
  );
}
