"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useSimulatedPlayer } from "@/lib/hooks/useSimulatedPlayer";
import type { Clip, Lesson, Module } from "@/lib/types";

// Key used to signal autoplay on mount to the next lesson
const AUTOPLAY_KEY = "assignx:autoplay";

/**
 * LessonPlayer is now a CONTROLLED component.
 *
 * The parent (LessonContent) owns currentClipIndex and watchedIndices.
 * LessonPlayer receives the active index, calls onClipChange to advance it,
 * and calls onClipWatched when a clip finishes.
 *
 * No state is pushed upward via useEffect. The only parent callbacks are
 * called from event handlers or from the single autoadvance effect (which
 * depends on a real state transition, not on every render). This eliminates
 * the render loop.
 */
export interface LessonPlayerProps {
  lesson: Lesson;
  module: Module;
  next: Lesson | null;
  moduleSlug: string;
  /** Derived clips array (stable reference from parent). */
  clips: Clip[];
  /** Index of the clip currently active (controlled). */
  currentClipIndex: number;
  /** Parent callback: switch to clip at index i. */
  onClipChange: (i: number) => void;
  /** Parent callback: mark clip at index i as watched. */
  onClipWatched: (i: number) => void;
}

// ---- Inline player visuals ----
function PlayerVisuals({
  accent,
  pct,
  isPlaying,
  onToggle,
  compact = false,
}: {
  accent: string;
  pct: number;
  isPlaying: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <>
      <div
        className="absolute inset-0 opacity-95"
        style={{ backgroundImage: accent }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <button
        onClick={onToggle}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white",
          compact ? "h-11 w-11" : "h-16 w-16",
        )}
      >
        {isPlaying ? (
          <Pause
            className={cn(compact ? "h-5 w-5" : "h-7 w-7")}
            fill="white"
            stroke="white"
          />
        ) : (
          <Play
            className={cn(
              compact ? "h-5 w-5 translate-x-0.5" : "h-7 w-7 translate-x-0.5",
            )}
            fill="white"
            stroke="none"
          />
        )}
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          className="h-full bg-white/80"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        />
      </div>
    </>
  );
}

// ---- Countdown ring ----
function CountdownRing({
  sec,
  total,
  svgId,
  reduced,
}: {
  sec: number;
  total: number;
  svgId: string;
  reduced: boolean;
}) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fraction = total > 0 ? sec / total : 0;
  const dash = reduced ? circ : circ * fraction;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={svgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7802df" />
          <stop offset="100%" stopColor="#ff0bd6" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
      {!reduced && (
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={`url(#${svgId})`} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dasharray 0.25s linear" }}
        />
      )}
      <text x="28" y="33" textAnchor="middle" fontSize="16" fontWeight="700" fill="white">
        {sec}
      </text>
    </svg>
  );
}

// ---- "Up next" countdown overlay ----
function CountdownOverlay({
  nextTitle,
  countdownSec,
  countdownTotal,
  svgId,
  onPlayNow,
  onCancel,
  reduced,
}: {
  nextTitle: string;
  countdownSec: number;
  countdownTotal: number;
  svgId: string;
  onPlayNow: () => void;
  onCancel: () => void;
  reduced: boolean;
}) {
  const playRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const rafId = requestAnimationFrame(() => { playRef.current?.focus(); });
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Up next: ${nextTitle}. Playing in ${countdownSec}`}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-3xl px-6 text-white"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Up next</p>
      <p className="text-center text-base font-semibold line-clamp-2 max-w-xs">{nextTitle}</p>
      <div aria-atomic="true" className="flex items-center gap-3">
        <CountdownRing sec={countdownSec} total={countdownTotal} svgId={svgId} reduced={reduced} />
        <span className="sr-only">Playing in {countdownSec}</span>
      </div>
      <div className="flex gap-3 mt-1">
        <Button ref={playRef} variant="primary" size="sm" onClick={onPlayNow}>Play now</Button>
        <button
          onClick={onCancel}
          className="h-9 px-4 text-sm font-medium rounded-[9px] border border-white/30 text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---- Module-complete overlay ----
function ModuleEndOverlay({ moduleSlug }: { moduleSlug: string }) {
  const router = useRouter();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-3xl px-6 text-white text-center">
      <p className="text-xl font-semibold">You finished this module.</p>
      <p className="text-sm text-white/70">Great work. Head back to the module to review or continue.</p>
      <Button variant="primary" size="sm" onClick={() => router.push(`/classroom/${moduleSlug}`)}>
        Back to module
      </Button>
    </div>
  );
}

// ---- Mini player ----
function MiniPlayer({
  clipTitle,
  accent,
  pct,
  isPlaying,
  countdownActive,
  countdownSec,
  countdownTotal,
  nextTitle,
  svgId,
  onToggle,
  onClose,
  onReturn,
  onPlayNow,
  onCancelCountdown,
  reduced,
}: {
  clipTitle: string;
  accent: string;
  pct: number;
  isPlaying: boolean;
  countdownActive: boolean;
  countdownSec: number;
  countdownTotal: number;
  nextTitle: string | null;
  svgId: string;
  onToggle: () => void;
  onClose: () => void;
  onReturn: () => void;
  onPlayNow: () => void;
  onCancelCountdown: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      role="region"
      aria-label={`Mini player: ${clipTitle}`}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "fixed z-50 overflow-hidden shadow-2xl",
        "bottom-0 left-0 right-0 rounded-t-2xl",
        "sm:bottom-5 sm:right-5 sm:left-auto sm:w-[340px] sm:rounded-2xl",
      )}
      style={{ backgroundImage: accent }}
    >
      {/* 16:9 surface so the mini matches the main player proportion; controls overlay it */}
      <div className="relative aspect-video bg-black/20">
        {/* Top controls overlay (scrim for legibility) */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-2 pt-1.5 pb-3 bg-gradient-to-b from-black/40 to-transparent">
          <button
            onClick={onReturn}
            aria-label="Return to player"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <p className="flex-1 mx-1 text-xs font-medium text-white/90 truncate">{clipTitle}</p>
          <button
            onClick={onClose}
            aria-label="Close mini player"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Center: play/pause or countdown, vertically and horizontally centered */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          {countdownActive && nextTitle ? (
            <div className="flex items-center gap-3">
              <CountdownRing
                sec={countdownSec} total={countdownTotal}
                svgId={`${svgId}-mini`} reduced={reduced}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Up next</p>
                <p className="text-xs font-medium text-white truncate">{nextTitle}</p>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={onPlayNow}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    Play now
                  </button>
                  <button
                    onClick={onCancelCountdown}
                    className="text-[11px] px-2.5 py-1 rounded-md text-white/70 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onToggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="white" stroke="white" />
              ) : (
                <Play className="h-5 w-5 translate-x-0.5" fill="white" stroke="none" />
              )}
            </button>
          )}
        </div>

        {/* Progress bar pinned to the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <motion.div
            className="h-full bg-white/80"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main LessonPlayer (controlled) ----
export function LessonPlayer({
  lesson,
  module,
  next,
  moduleSlug,
  clips,
  currentClipIndex,
  onClipChange,
  onClipWatched,
}: LessonPlayerProps) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const svgId = useId().replace(/:/g, "");

  const clip = clips[currentClipIndex] ?? clips[0];
  const hasNextClip = currentClipIndex < clips.length - 1;
  const nextClip = hasNextClip ? clips[currentClipIndex + 1] : null;

  // "Up next" title: next clip in lesson, or the next lesson title
  const upNextTitle = nextClip ? nextClip.title : next?.title ?? null;

  const player = useSimulatedPlayer(clip.durationSec);
  const { state, elapsed, durationSec, countdownSec, togglePlay, cancelCountdown, reset } =
    player;

  const pct = Math.min((elapsed / durationSec) * 100, 100);
  const isPlaying = state === "playing" || state === "countdown";
  const countdownActive = state === "countdown";
  const countdownTotal = 5; // ring covers 5 second window

  const [showMini, setShowMini] = useState(false);
  const [miniClosed, setMiniClosed] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);
  const navigatedRef = useRef(false);

  // Track the last clip index we actually played, so playback (re)starts only on a
  // genuine index change, never on initial mount (even under StrictMode double-invoke).
  const prevClipIndexRef = useRef(currentClipIndex);

  // Guard so each entry into the "autoadvance" state is handled exactly once.
  // Advancing the index re-runs the autoadvance effect (currentClipIndex is a dep)
  // before state leaves "autoadvance"; without this guard that causes a double
  // advance (a skipped clip). Reset to false once state leaves "autoadvance".
  const autoadvanceHandledRef = useRef(false);

  // Portal mount guard (SSR-safe): createPortal only runs after hydration.
  // setState here is the canonical mounted-flag pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalMounted(true);
  }, []);

  // Autoplay flag from previous lesson (runs once on mount per lesson instance)
  useEffect(() => {
    let shouldPlay = false;
    try {
      const flag = sessionStorage.getItem(AUTOPLAY_KEY);
      sessionStorage.removeItem(AUTOPLAY_KEY);
      if (flag === lesson.id) shouldPlay = true;
    } catch {
      // sessionStorage unavailable
    }
    if (shouldPlay) player.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // React to currentClipIndex changes: reset the timer and auto-play.
  // Using prevClipIndexRef (initialized to the starting index) means the guard
  // holds on initial mount AND under StrictMode double-invoke, because both
  // invocations see prevClipIndexRef.current === currentClipIndex and return early.
  // Only a genuine index change (selection or auto-advance) triggers playback.
  useEffect(() => {
    if (prevClipIndexRef.current === currentClipIndex) return; // mount or no real change
    prevClipIndexRef.current = currentClipIndex;
    reset();
    // Small rAF delay so reset() state flush is complete before play()
    const raf = requestAnimationFrame(() => { player.play(); });
    return () => cancelAnimationFrame(raf);
  // reset and player.play are stable useCallback refs from useSimulatedPlayer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClipIndex]);

  // IntersectionObserver for mini-player
  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (visible) {
          setShowMini(false);
          setMiniClosed(false);
        } else {
          if (!miniClosed) setShowMini(true);
        }
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [miniClosed]);

  // Navigate to next lesson
  const navigateToNext = useCallback(() => {
    if (!next) return;
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    try {
      sessionStorage.setItem(AUTOPLAY_KEY, next.id);
    } catch {
      // ignore
    }
    router.push(`/classroom/${moduleSlug}/${next.id}`);
  }, [next, moduleSlug, router]);

  // Autoadvance effect: only runs when state transitions to "autoadvance".
  // Callbacks onClipChange / onClipWatched are stable (useCallback with []
  // deps in LessonContent), so this effect never re-runs spuriously.
  useEffect(() => {
    if (state !== "autoadvance") {
      autoadvanceHandledRef.current = false;
      return;
    }
    if (autoadvanceHandledRef.current) return;
    autoadvanceHandledRef.current = true;
    if (hasNextClip) {
      // Advance within the lesson: notify parent about index change and watched
      onClipWatched(currentClipIndex);
      onClipChange(currentClipIndex + 1);
    } else if (next) {
      // Last clip in lesson, next lesson exists: navigate
      onClipWatched(currentClipIndex);
      navigateToNext();
    } else {
      // Last clip of the last lesson: mark watched so the lesson can complete
      onClipWatched(currentClipIndex);
    }
  }, [state, hasNextClip, next, currentClipIndex, onClipWatched, onClipChange, navigateToNext]);

  // "Play now" button inside the countdown overlay
  const handlePlayNow = useCallback(() => {
    player.confirmAutoplay();
    // Mark the current clip watched in every case (including the last one) so a
    // lesson finished via "Play now" still counts toward course progress.
    onClipWatched(currentClipIndex);
    if (hasNextClip) {
      onClipChange(currentClipIndex + 1);
    } else {
      navigateToNext();
    }
  }, [player, hasNextClip, currentClipIndex, onClipWatched, onClipChange, navigateToNext]);

  // Cancel: between clips = stay on current clip (paused/ended);
  // last clip = show lesson-complete banner.
  const handleCancel = useCallback(() => {
    cancelCountdown();
  }, [cancelCountdown]);

  const handleMiniClose = useCallback(() => {
    setShowMini(false);
    setMiniClosed(true);
  }, []);

  const handleMiniReturn = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Overlay flags
  const showModuleEnd = state === "ended" && !hasNextClip && !next;
  const showLessonCancelledEnd = state === "ended" && !hasNextClip && !!next;

  return (
    <>
      {/* ---- Inline player ---- */}
      <div
        ref={playerRef}
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-line"
      >
        <PlayerVisuals
          accent={module.accent}
          pct={pct}
          isPlaying={isPlaying}
          onToggle={togglePlay}
        />

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdownActive && upNextTitle && (
            <motion.div
              key="countdown"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <CountdownOverlay
                nextTitle={upNextTitle}
                countdownSec={countdownSec}
                countdownTotal={countdownTotal}
                svgId={svgId}
                onPlayNow={handlePlayNow}
                onCancel={handleCancel}
                reduced={reduced}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Module-end overlay */}
        <AnimatePresence>
          {showModuleEnd && (
            <motion.div
              key="module-end"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <ModuleEndOverlay moduleSlug={moduleSlug} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Now-playing label + topic counter */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
          <div className="max-w-[70%]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 leading-none mb-0.5">
              Now playing
            </p>
            <p className="text-xs font-semibold text-white line-clamp-1 leading-snug drop-shadow">
              {clip.title}
            </p>
          </div>
          {clips.length > 1 && (
            <p className="text-[10px] font-medium text-white/60 shrink-0 ml-2">
              {currentClipIndex + 1} / {clips.length}
            </p>
          )}
        </div>
      </div>

      {/* Lesson-complete banner: Cancel on last clip, next lesson exists */}
      <AnimatePresence>
        {showLessonCancelledEnd && (
          <motion.div
            key="lesson-complete"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-700"
          >
            <span className="font-medium">Lesson complete.</span>
            <a
              href={`/classroom/${moduleSlug}/${next!.id}`}
              className="ml-auto font-semibold text-brand-500 hover:underline whitespace-nowrap"
            >
              Next lesson: {next!.title}
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Mini-player portal ---- */}
      {portalMounted &&
        createPortal(
          <>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {showMini ? `Mini player active: ${clip.title}` : ""}
            </div>
            <AnimatePresence>
              {showMini && (
                <MiniPlayer
                  key="mini"
                  clipTitle={clip.title}
                  accent={module.accent}
                  pct={pct}
                  isPlaying={isPlaying}
                  countdownActive={countdownActive}
                  countdownSec={countdownSec}
                  countdownTotal={countdownTotal}
                  nextTitle={upNextTitle}
                  svgId={svgId}
                  onToggle={togglePlay}
                  onClose={handleMiniClose}
                  onReturn={handleMiniReturn}
                  onPlayNow={handlePlayNow}
                  onCancelCountdown={handleCancel}
                  reduced={reduced}
                />
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </>
  );
}
