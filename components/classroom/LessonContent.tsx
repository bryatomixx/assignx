"use client";

/**
 * LessonContent
 *
 * Owns the per-lesson UI state (currentClipIndex + watchedIndices + task
 * completion) for a single lesson. Rendered with key={lesson.id} by the page,
 * so React unmounts and remounts this component on every lesson navigation --
 * no reset effect needed.
 *
 * Layout (Model A): a two-pane classroom.
 *   - Left rail  : ChapterRail ("What you'll cover") -- selects a chapter.
 *   - Main pane  : LessonPlayer (the chapter video) + ChapterDetail
 *                  (the chapter description + its own task).
 *
 * Every pane reads the same currentClipIndex, so selecting a chapter in the
 * rail swaps the video AND the description/task in lockstep. Data flows strictly
 * top-down; no useEffect ever calls a parent setState, so there is no render loop.
 */

import { useCallback, useEffect, useState } from "react";
import { getLessonChapters, getLessonClips } from "@/lib/mock/modules";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { LessonPlayer } from "@/components/classroom/LessonPlayer";
import { ChapterRail } from "@/components/classroom/ChapterRail";
import { ChapterDetail } from "@/components/classroom/ChapterDetail";
import type { Lesson, Module } from "@/lib/types";

interface LessonContentProps {
  lesson: Lesson;
  module: Module;
  next: Lesson | null;
  moduleSlug: string;
}

export function LessonContent({
  lesson,
  module,
  next,
  moduleSlug,
}: LessonContentProps) {
  // Chapters are the source of truth; clips are the player projection of them.
  // Stable for the lifetime of this instance (key={lesson.id} on the parent
  // guarantees a fresh instance per lesson, so no stale-closure risk).
  const chapters = getLessonChapters(lesson);
  const clips = getLessonClips(lesson);

  const { markComplete, isComplete } = useAcademy();

  // --- Per-lesson UI state lives here, flows down as props ---
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [watchedIndices, setWatchedIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [taskDoneIndices, setTaskDoneIndices] = useState<Set<number>>(
    () => new Set(),
  );

  // Auto-complete: once every chapter in this lesson has been watched, mark the
  // lesson complete so it counts toward course progress. markComplete is
  // idempotent and the isComplete guard stops this from re-running.
  useEffect(() => {
    if (
      clips.length > 0 &&
      watchedIndices.size >= clips.length &&
      !isComplete(lesson.id)
    ) {
      markComplete(lesson.id);
    }
  }, [watchedIndices, clips.length, lesson.id, isComplete, markComplete]);

  // Stable callback: mark a chapter index as watched. Updater form so it never
  // needs watchedIndices in its dep array.
  const handleClipWatched = useCallback((i: number) => {
    setWatchedIndices((prev) => {
      if (prev.has(i)) return prev; // no change -> no re-render
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  const handleClipChange = useCallback((i: number) => {
    setCurrentClipIndex(i);
  }, []);

  const handleSelectChapter = useCallback((i: number) => {
    setCurrentClipIndex(i);
  }, []);

  const handleToggleTask = useCallback((i: number) => {
    setTaskDoneIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const currentChapter = chapters[currentClipIndex] ?? chapters[0];

  // Bottom-of-rail navigation: go to the next lesson, or back to the module
  // overview when this is the last lesson.
  const nextNav = next
    ? { href: `/classroom/${moduleSlug}/${next.id}`, label: "Next lesson" }
    : { href: `/classroom/${moduleSlug}`, label: "Back to module" };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Left rail: chapter list. Sticky on desktop so it tracks while you
          scroll the main pane. */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ChapterRail
          chapters={chapters}
          currentIndex={currentClipIndex}
          watchedIndices={watchedIndices}
          taskDoneIndices={taskDoneIndices}
          onSelect={handleSelectChapter}
          next={nextNav}
        />
      </aside>

      {/* Main pane: the selected chapter's video + description + task. */}
      <div className="min-w-0">
        {/* Controlled player: receives currentClipIndex from above, calls
            onClipChange / onClipWatched to signal state changes upward. */}
        <LessonPlayer
          lesson={lesson}
          module={module}
          next={next}
          moduleSlug={moduleSlug}
          clips={clips}
          currentClipIndex={currentClipIndex}
          onClipChange={handleClipChange}
          onClipWatched={handleClipWatched}
        />

        {currentChapter && (
          <ChapterDetail
            chapter={currentChapter}
            taskDone={taskDoneIndices.has(currentClipIndex)}
            onToggleTask={() => handleToggleTask(currentClipIndex)}
          />
        )}
      </div>
    </div>
  );
}
