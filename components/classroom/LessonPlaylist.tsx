"use client";

import { Check, CirclePlay, Loader2 } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bullet, Clip, LessonSection } from "@/lib/types";

// ---- Sub-bullet renderer (read-only, reuses the same visual as LessonSections) ----
function SubBullets({ bullets }: { bullets: Bullet[] }) {
  return (
    <ul className="mt-1.5 flex flex-col gap-1.5 pl-5">
      {bullets.map((node, i) => (
        <li key={i} className="leading-relaxed">
          <div className="flex items-start gap-2">
            <span
              className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: "#c9bff0" }}
            />
            <span className="text-sm text-ink-700">
              {node.href ? (
                <a
                  href={node.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-brand-500 hover:underline"
                >
                  {node.text}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                node.text
              )}
            </span>
          </div>
          {node.children && node.children.length > 0 && (
            <SubBullets bullets={node.children} />
          )}
        </li>
      ))}
    </ul>
  );
}

// ---- Status icon per row ----
type RowStatus = "playing" | "done" | "pending";

function StatusIcon({
  status,
  index,
}: {
  status: RowStatus;
  index: number;
}) {
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
  // Pending: show CirclePlay tinted lightly, with the index number as
  // accessible text via sr-only span.
  return (
    <span className="relative h-4 w-4 shrink-0 flex items-center justify-center">
      <CirclePlay
        className="h-4 w-4 text-ink-300"
        aria-hidden="true"
      />
      <span className="sr-only">{index + 1}</span>
    </span>
  );
}

// ---- Single playlist row ----
function PlaylistRow({
  bullet,
  clip,
  index,
  status,
  onSelect,
}: {
  bullet: Bullet;
  clip: Clip;
  index: number;
  status: RowStatus;
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
              {clip.title}
            </p>
            {/* Sub-bullets are read-only informational content */}
            {bullet.children && bullet.children.length > 0 && (
              <SubBullets bullets={bullet.children} />
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ---- Public component ----
export interface LessonPlaylistProps {
  /** The cover section (typically "What you'll cover"). */
  section: LessonSection;
  /** Derived clips (same order as section.bullets). */
  clips: Clip[];
  /** Index of the clip currently playing (or selected). */
  currentClipIndex: number;
  /** Indices of clips that have been fully watched. */
  watchedIndices: Set<number>;
  /** Called when the user clicks a row to jump to that clip. */
  onSelectClip: (index: number) => void;
}

export function LessonPlaylist({
  section,
  clips,
  currentClipIndex,
  watchedIndices,
  onSelectClip,
}: LessonPlaylistProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
        {section.heading}
      </h3>
      <ul className="flex flex-col gap-0.5">
        {clips.map((clip, i) => {
          const bullet = section.bullets[i];
          const status: RowStatus =
            i === currentClipIndex
              ? "playing"
              : watchedIndices.has(i)
              ? "done"
              : "pending";
          return (
            <PlaylistRow
              key={clip.id}
              bullet={bullet}
              clip={clip}
              index={i}
              status={status}
              onSelect={() => onSelectClip(i)}
            />
          );
        })}
      </ul>
    </div>
  );
}
