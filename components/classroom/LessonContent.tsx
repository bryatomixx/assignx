"use client";

/**
 * LessonContent
 *
 * Owns the playlist state (currentClipIndex + watchedIndices) for a single
 * lesson. Rendered with key={lesson.id} by the page, so React automatically
 * unmounts and remounts this component on every lesson navigation -- no reset
 * effect needed.
 *
 * Data flow is strictly top-down:
 *   LessonContent (state owner)
 *     -> LessonPlayer  (controlled: receives currentClipIndex, calls callbacks)
 *     -> LessonPlaylist (reads same state, calls onSelectClip)
 *
 * No useEffect ever calls a parent setState, so there is no render loop.
 */

import { useCallback, useEffect, useState } from "react";
import { getLessonClips, getCoverSection } from "@/lib/mock/modules";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { LessonPlayer } from "@/components/classroom/LessonPlayer";
import { LessonPlaylist } from "@/components/classroom/LessonPlaylist";
import { LessonSections } from "@/components/classroom/LessonSections";
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
  // Derive clips once -- stable reference for the lifetime of this component
  // instance (key={lesson.id} on the parent guarantees a fresh instance per
  // lesson, so no stale-closure risk).
  const clips = getLessonClips(lesson);
  const coverSection = getCoverSection(lesson);
  const hasCoverSection = !!coverSection && clips.length > 1;

  const { markComplete, isComplete } = useAcademy();

  // --- Playlist state lives here, flows down as props ---
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [watchedIndices, setWatchedIndices] = useState<Set<number>>(
    () => new Set(),
  );

  // Auto-complete: once every clip in this lesson has been watched, mark the
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

  // Stable callback: mark a clip index as watched.
  // Uses updater form so it never needs watchedIndices in its dep array.
  const handleClipWatched = useCallback((i: number) => {
    setWatchedIndices((prev) => {
      if (prev.has(i)) return prev; // no change -> no re-render
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  // Stable callback: advance to a specific clip index (from auto-advance).
  const handleClipChange = useCallback((i: number) => {
    setCurrentClipIndex(i);
  }, []);

  // Stable callback: user clicks a row in the playlist sidebar.
  const handleSelectClip = useCallback((i: number) => {
    setCurrentClipIndex(i);
  }, []);

  return (
    <>
      {/* Controlled player: receives currentClipIndex from above, calls
          onClipChange / onClipWatched to signal state changes upward.
          No internal clip-index state; no onPlaylistState push. */}
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

      {/* Cover section: rendered as interactive playlist when multiple clips */}
      {hasCoverSection && coverSection && (
        <LessonPlaylist
          section={coverSection}
          clips={clips}
          currentClipIndex={currentClipIndex}
          watchedIndices={watchedIndices}
          onSelectClip={handleSelectClip}
        />
      )}

      {/* Cover section as plain list when there is only 1 clip */}
      {!hasCoverSection && coverSection && (
        <LessonSections sections={[coverSection]} />
      )}
    </>
  );
}
