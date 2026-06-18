"use client";

/**
 * LessonMedia
 *
 * The media for a single lesson. A lesson is one teaching video, so it wraps
 * LessonPlayer with a single clip. Three outcomes:
 *   - text lesson           -> renders nothing (the page shows the written content)
 *   - video lesson, has URL  -> the player (YouTube rich / Loom embed)
 *   - video lesson, no URL   -> a branded "coming soon" placeholder (no autoplay
 *                               so the user is not auto-advanced through empty lessons)
 *
 * When the single clip finishes, LessonPlayer auto-advances to the next lesson;
 * onClipWatched marks this lesson complete.
 */

import { useCallback } from "react";
import { PlayCircle } from "lucide-react";
import { getLessonClips } from "@/lib/mock/modules";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { LessonPlayer } from "@/components/classroom/LessonPlayer";
import type { Lesson, Module } from "@/lib/types";

function ComingSoonCard({ module }: { module: Module }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-line">
      <div
        className="absolute inset-0 opacity-95"
        style={{ backgroundImage: module.accent }}
      />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <PlayCircle className="h-8 w-8" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
          Video coming soon
        </p>
      </div>
    </div>
  );
}

export interface LessonMediaProps {
  lesson: Lesson;
  module: Module;
  next: Lesson | null;
  moduleSlug: string;
}

export function LessonMedia({
  lesson,
  module,
  next,
  moduleSlug,
}: LessonMediaProps) {
  const { markComplete, isComplete } = useAcademy();

  const handleWatched = useCallback(() => {
    if (!isComplete(lesson.id)) markComplete(lesson.id);
  }, [lesson.id, isComplete, markComplete]);

  const noop = useCallback(() => {}, []);

  const clips = getLessonClips(lesson);
  if (clips.length === 0) return null; // text lesson
  if (!clips[0].video) return <ComingSoonCard module={module} />;

  return (
    <LessonPlayer
      lesson={lesson}
      module={module}
      next={next}
      moduleSlug={moduleSlug}
      clips={clips}
      currentClipIndex={0}
      onClipChange={noop}
      onClipWatched={handleWatched}
    />
  );
}
