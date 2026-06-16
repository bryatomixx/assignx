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
import { useYouTubePlayer } from "@/lib/hooks/useYouTubePlayer";
import { useAcademy } from "@/lib/store/AcademyProvider";
import type { Clip, Lesson, Module } from "@/lib/types";

// Key used to signal autoplay on mount to the next lesson
const AUTOPLAY_KEY = "assignx:autoplay";

/**
 * LessonPlayer is a CONTROLLED component.
 *
 * For each clip there are two possible sub-components:
 *   - SimulatedClipPlayer: uses useSimulatedPlayer (placeholder gradient)
 *   - YouTubeClipPlayer:   uses useYouTubePlayer (real IFrame API)
 *
 * Both sub-components receive all the props they need to render the full UI
 * (overlays, mini-player, progress bar). This avoids conditional hook calls
 * because each sub-component always calls exactly one hook. React re-mounts
 * the sub-component when currentClipIndex changes (via the "key" prop on the
 * sub-component), giving each clip a fresh hook instance.
 *
 * MINI-PLAYER (PiP) WITH YOUTUBE:
 *   The mini-player renders via portal (createPortal to document.body) and
 *   shows the module gradient + controls. We do NOT reparent the YouTube
 *   iframe -- doing so destroys and recreates it (iframe reload). Instead the
 *   iframe stays in the inline player container (even when it scrolls off
 *   screen); the mini-player gradient surface shows playback controls that
 *   call play/pause on the hidden iframe. This is the preferred strategy.
 *
 * AUTOPLAY ON AUTO-ADVANCE:
 *   The initial play is always a user gesture, granting browser autoplay
 *   permission for that session. On clip auto-advance the new sub-component
 *   mounts and play() is called after reset(). If the browser blocks it
 *   (audio policy), YT.onStateChange fires PAUSED and state stays "paused",
 *   showing the play button. No forced mute is applied; if you want guaranteed
 *   silent autoplay, set playerVars.mute=1 in useYouTubePlayer.
 */
export interface LessonPlayerProps {
  lesson: Lesson;
  module: Module;
  next: Lesson | null;
  moduleSlug: string;
  clips: Clip[];
  currentClipIndex: number;
  onClipChange: (i: number) => void;
  onClipWatched: (i: number) => void;
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
  posterUrl,
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
  posterUrl?: string;
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
      <div className="relative aspect-video bg-black/20">
        {posterUrl && (
          <>
            <img
              src={posterUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/35" />
          </>
        )}
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

// ---- Shared player UI used by both SimulatedClipPlayer and YouTubeClipPlayer ----
// Receives all state/callbacks from the outer shell, which owns the
// progress-tracking, autoadvance, and mini-player logic.
function PlayerUI({
  clip,
  clips,
  currentClipIndex,
  module,
  moduleSlug,
  next,
  upNextTitle,
  isYouTube,
  youtubeHostRef,
  // player state
  countdownSec,
  isPlaying,
  countdownActive,
  pct,
  countdownTotal,
  showModuleEnd,
  showLessonCancelledEnd,
  showMini,
  portalMounted,
  svgId,
  reduced,
  // handlers
  onToggle,
  onPlayNow,
  onCancel,
  onMiniClose,
  onMiniReturn,
  // intersection ref
  inlinePlayerRef,
}: {
  clip: Clip;
  clips: Clip[];
  currentClipIndex: number;
  module: Module;
  moduleSlug: string;
  next: Lesson | null;
  upNextTitle: string | null;
  isYouTube: boolean;
  youtubeHostRef?: React.RefObject<HTMLDivElement | null>;
  countdownSec: number;
  isPlaying: boolean;
  countdownActive: boolean;
  pct: number;
  countdownTotal: number;
  showModuleEnd: boolean;
  showLessonCancelledEnd: boolean;
  showMini: boolean;
  portalMounted: boolean;
  svgId: string;
  reduced: boolean;
  onToggle: () => void;
  onPlayNow: () => void;
  onCancel: () => void;
  onMiniClose: () => void;
  onMiniReturn: () => void;
  inlinePlayerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      {/* ---- Inline player ---- */}
      <div
        ref={inlinePlayerRef}
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-line"
      >
        {/* Background gradient (always shown; for YouTube it sits behind the iframe) */}
        <div
          className="absolute inset-0 opacity-95"
          style={{ backgroundImage: module.accent }}
        />
        <div className="absolute inset-0 bg-black/20" />

        {/* YouTube iframe host -- the YT.Player attaches here and must NOT be moved */}
        {isYouTube && youtubeHostRef && (
          <div
            ref={youtubeHostRef}
            className="absolute inset-0 z-0 [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:border-0"
            aria-label="YouTube video player"
          />
        )}

        {/* Branded cover over the YouTube iframe while paused or idle. YouTube
            shows its own pause overlay (center button, suggested videos, logo)
            that cannot be hidden via CSS on a cross-origin iframe. Covering it
            with the module gradient means only our single control shows, so the
            play/pause buttons no longer double up. While playing, the cover is
            gone and the real video is visible. */}
        {isYouTube && !isPlaying && (
          <div className="absolute inset-0 z-[5]" aria-hidden="true">
            <div
              className="absolute inset-0 opacity-95"
              style={{ backgroundImage: module.accent }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        {/* Play/pause button (shown when not in countdown) */}
        {!countdownActive && (
          <button
            onClick={onToggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" fill="white" stroke="white" />
            ) : (
              <Play className="h-7 w-7 translate-x-0.5" fill="white" stroke="none" />
            )}
          </button>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-white/20">
          <motion.div
            className="h-full bg-white/80"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
          />
        </div>

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdownActive && upNextTitle && (
            <motion.div
              key="countdown"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20"
            >
              <CountdownOverlay
                nextTitle={upNextTitle}
                countdownSec={countdownSec}
                countdownTotal={countdownTotal}
                svgId={svgId}
                onPlayNow={onPlayNow}
                onCancel={onCancel}
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
              className="absolute inset-0 z-20"
            >
              <ModuleEndOverlay moduleSlug={moduleSlug} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Now-playing label + topic counter */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-end justify-between pointer-events-none">
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

        {/* YouTube source badge */}
        {isYouTube && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/70 backdrop-blur">
              YouTube
            </span>
          </div>
        )}
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
                  posterUrl={
                    isYouTube && clip.videoId
                      ? `https://i.ytimg.com/vi/${clip.videoId}/hqdefault.jpg`
                      : undefined
                  }
                  pct={pct}
                  isPlaying={isPlaying}
                  countdownActive={countdownActive}
                  countdownSec={countdownSec}
                  countdownTotal={countdownTotal}
                  nextTitle={upNextTitle}
                  svgId={svgId}
                  onToggle={onToggle}
                  onClose={onMiniClose}
                  onReturn={onMiniReturn}
                  onPlayNow={onPlayNow}
                  onCancelCountdown={onCancel}
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

// ---- Props shared by both clip sub-components ----
interface ClipSubProps {
  lesson: Lesson;
  module: Module;
  next: Lesson | null;
  moduleSlug: string;
  clips: Clip[];
  currentClipIndex: number;
  onClipChange: (i: number) => void;
  onClipWatched: (i: number) => void;
  /** Whether this clip auto-started (from a previous lesson's "Play now" or auto-advance). */
  shouldAutoplay: boolean;
}

// ---- SimulatedClipPlayer ----
// Always calls useSimulatedPlayer. Handles all player logic for gradient clips.
function SimulatedClipPlayer({
  lesson,
  module,
  next,
  moduleSlug,
  clips,
  currentClipIndex,
  onClipChange,
  onClipWatched,
  shouldAutoplay,
}: ClipSubProps) {
  const clip = clips[currentClipIndex] ?? clips[0];
  const reduced = useReducedMotion() ?? false;
  const svgId = useId().replace(/:/g, "");
  const router = useRouter();

  const player = useSimulatedPlayer(clip.durationSec);
  const { state, elapsed, durationSec, countdownSec, togglePlay, cancelCountdown } = player;

  const hasNextClip = currentClipIndex < clips.length - 1;
  const nextClip = hasNextClip ? clips[currentClipIndex + 1] : null;
  const upNextTitle = nextClip ? nextClip.title : next?.title ?? null;

  const pct = Math.min((elapsed / durationSec) * 100, 100);
  const isPlaying = state === "playing" || state === "countdown";
  const countdownActive = state === "countdown";
  const countdownTotal = 5;

  // ---- Video progress tracking ----
  const { recordVideoProgress } = useAcademy();
  const lastRecordedSecRef = useRef(-1);

  useEffect(() => {
    lastRecordedSecRef.current = -1;
  }, [currentClipIndex]);

  useEffect(() => {
    const intElapsed = Math.floor(elapsed);
    if (intElapsed > lastRecordedSecRef.current && elapsed > 0) {
      lastRecordedSecRef.current = intElapsed;
      recordVideoProgress(lesson.id, currentClipIndex, elapsed, clip.durationSec);
    }
  }, [elapsed, lesson.id, currentClipIndex, clip.durationSec, recordVideoProgress]);

  useEffect(() => {
    if (state === "paused" && elapsed > 0) {
      recordVideoProgress(lesson.id, currentClipIndex, elapsed, clip.durationSec);
    }
  }, [state, elapsed, lesson.id, currentClipIndex, clip.durationSec, recordVideoProgress]);

  const flushRef = useRef({ lesson, currentClipIndex, clip, elapsed, recordVideoProgress });
  useEffect(() => {
    flushRef.current = { lesson, currentClipIndex, clip, elapsed, recordVideoProgress };
  });
  useEffect(() => {
    return () => {
      const { lesson: l, currentClipIndex: ci, clip: c, elapsed: e, recordVideoProgress: rec } =
        flushRef.current;
      if (e > 0) rec(l.id, ci, e, c.durationSec);
    };
  }, []);

  // ---- Mini-player state ----
  const [showMini, setShowMini] = useState(false);
  const [miniClosed, setMiniClosed] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const inlinePlayerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPortalMounted(true); }, []);

  // ---- Autoplay on mount (from previous lesson or clip advance) ----
  useEffect(() => {
    if (shouldAutoplay) player.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Autoadvance ----
  const navigatedRef = useRef(false);
  const autoadvanceHandledRef = useRef(false);

  const navigateToNext = useCallback(() => {
    if (!next || navigatedRef.current) return;
    navigatedRef.current = true;
    try { sessionStorage.setItem(AUTOPLAY_KEY, next.id); } catch { /* ignore */ }
    router.push(`/classroom/${moduleSlug}/${next.id}`);
  }, [next, moduleSlug, router]);

  useEffect(() => {
    if (state !== "autoadvance") {
      autoadvanceHandledRef.current = false;
      return;
    }
    if (autoadvanceHandledRef.current) return;
    autoadvanceHandledRef.current = true;
    if (hasNextClip) {
      onClipWatched(currentClipIndex);
      onClipChange(currentClipIndex + 1);
    } else if (next) {
      onClipWatched(currentClipIndex);
      navigateToNext();
    } else {
      onClipWatched(currentClipIndex);
    }
  }, [state, hasNextClip, next, currentClipIndex, onClipWatched, onClipChange, navigateToNext]);

  const handlePlayNow = useCallback(() => {
    player.confirmAutoplay();
    onClipWatched(currentClipIndex);
    if (hasNextClip) {
      onClipChange(currentClipIndex + 1);
    } else {
      navigateToNext();
    }
  }, [player, hasNextClip, currentClipIndex, onClipWatched, onClipChange, navigateToNext]);

  const handleCancel = useCallback(() => { cancelCountdown(); }, [cancelCountdown]);
  const handleMiniClose = useCallback(() => { setShowMini(false); setMiniClosed(true); }, []);
  const handleMiniReturn = useCallback(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  // IntersectionObserver
  useEffect(() => {
    const el = inlinePlayerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (visible) { setShowMini(false); setMiniClosed(false); }
        else if (!miniClosed) { setShowMini(true); }
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [miniClosed]);

  const showModuleEnd = state === "ended" && !hasNextClip && !next;
  const showLessonCancelledEnd = state === "ended" && !hasNextClip && !!next;

  return (
    <PlayerUI
      clip={clip}
      clips={clips}
      currentClipIndex={currentClipIndex}
      module={module}
      moduleSlug={moduleSlug}
      next={next}
      upNextTitle={upNextTitle}
      isYouTube={false}
      countdownSec={countdownSec}
      isPlaying={isPlaying}
      countdownActive={countdownActive}
      pct={pct}
      countdownTotal={countdownTotal}
      showModuleEnd={showModuleEnd}
      showLessonCancelledEnd={showLessonCancelledEnd}
      showMini={showMini}
      portalMounted={portalMounted}
      svgId={svgId}
      reduced={reduced}
      onToggle={togglePlay}
      onPlayNow={handlePlayNow}
      onCancel={handleCancel}
      onMiniClose={handleMiniClose}
      onMiniReturn={handleMiniReturn}
      inlinePlayerRef={inlinePlayerRef}
    />
  );
}

// ---- YouTubeClipPlayer ----
// Always calls useYouTubePlayer. Handles all player logic for YouTube clips.
function YouTubeClipPlayer({
  lesson,
  module,
  next,
  moduleSlug,
  clips,
  currentClipIndex,
  onClipChange,
  onClipWatched,
  shouldAutoplay,
}: ClipSubProps) {
  const clip = clips[currentClipIndex] ?? clips[0];
  const reduced = useReducedMotion() ?? false;
  const svgId = useId().replace(/:/g, "");
  const router = useRouter();

  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const player = useYouTubePlayer(youtubeHostRef, clip.videoId!);
  const { state, elapsed, durationSec, countdownSec, togglePlay, cancelCountdown } = player;

  const hasNextClip = currentClipIndex < clips.length - 1;
  const nextClip = hasNextClip ? clips[currentClipIndex + 1] : null;
  const upNextTitle = nextClip ? nextClip.title : next?.title ?? null;

  const effectiveDuration = durationSec || clip.durationSec;
  const pct = Math.min((elapsed / effectiveDuration) * 100, 100);
  const isPlaying = state === "playing" || state === "countdown";
  const countdownActive = state === "countdown";
  const countdownTotal = 5;

  // ---- Video progress tracking ----
  const { recordVideoProgress } = useAcademy();
  const lastRecordedSecRef = useRef(-1);

  useEffect(() => {
    lastRecordedSecRef.current = -1;
  }, [currentClipIndex]);

  useEffect(() => {
    const intElapsed = Math.floor(elapsed);
    if (intElapsed > lastRecordedSecRef.current && elapsed > 0) {
      lastRecordedSecRef.current = intElapsed;
      recordVideoProgress(lesson.id, currentClipIndex, elapsed, effectiveDuration);
    }
  }, [elapsed, lesson.id, currentClipIndex, effectiveDuration, recordVideoProgress]);

  useEffect(() => {
    if (state === "paused" && elapsed > 0) {
      recordVideoProgress(lesson.id, currentClipIndex, elapsed, effectiveDuration);
    }
  }, [state, elapsed, lesson.id, currentClipIndex, effectiveDuration, recordVideoProgress]);

  const flushRef = useRef({ lesson, currentClipIndex, clip, elapsed, effectiveDuration, recordVideoProgress });
  useEffect(() => {
    flushRef.current = { lesson, currentClipIndex, clip, elapsed, effectiveDuration, recordVideoProgress };
  });
  useEffect(() => {
    return () => {
      const { lesson: l, currentClipIndex: ci, clip: c, elapsed: e, effectiveDuration: d, recordVideoProgress: rec } =
        flushRef.current;
      if (e > 0) rec(l.id, ci, e, d || c.durationSec);
    };
  }, []);

  // ---- Mini-player state ----
  const [showMini, setShowMini] = useState(false);
  const [miniClosed, setMiniClosed] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const inlinePlayerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPortalMounted(true); }, []);

  // ---- Autoplay on mount (from previous lesson) ----
  // YouTube player is not ready immediately; we play once the API calls onReady
  // internally. The useYouTubePlayer hook handles this via YT.Player onReady.
  // We just need to call play() once shouldAutoplay is true.
  // Since the player starts "idle" and transitions to "idle/paused" on ready,
  // we store the intent in a ref and call play() after the first state update.
  const autoplayFiredRef = useRef(false);
  useEffect(() => {
    if (!shouldAutoplay || autoplayFiredRef.current) return;
    if (state === "idle") {
      // Player is ready and idle -- trigger play
      autoplayFiredRef.current = true;
      player.play();
    }
  // Re-run when state changes (e.g. when YT player signals onReady -> idle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, shouldAutoplay]);

  // ---- Autoadvance ----
  const navigatedRef = useRef(false);
  const autoadvanceHandledRef = useRef(false);

  const navigateToNext = useCallback(() => {
    if (!next || navigatedRef.current) return;
    navigatedRef.current = true;
    try { sessionStorage.setItem(AUTOPLAY_KEY, next.id); } catch { /* ignore */ }
    router.push(`/classroom/${moduleSlug}/${next.id}`);
  }, [next, moduleSlug, router]);

  useEffect(() => {
    if (state !== "autoadvance") {
      autoadvanceHandledRef.current = false;
      return;
    }
    if (autoadvanceHandledRef.current) return;
    autoadvanceHandledRef.current = true;
    if (hasNextClip) {
      onClipWatched(currentClipIndex);
      onClipChange(currentClipIndex + 1);
    } else if (next) {
      onClipWatched(currentClipIndex);
      navigateToNext();
    } else {
      onClipWatched(currentClipIndex);
    }
  }, [state, hasNextClip, next, currentClipIndex, onClipWatched, onClipChange, navigateToNext]);

  const handlePlayNow = useCallback(() => {
    player.confirmAutoplay();
    onClipWatched(currentClipIndex);
    if (hasNextClip) {
      onClipChange(currentClipIndex + 1);
    } else {
      navigateToNext();
    }
  }, [player, hasNextClip, currentClipIndex, onClipWatched, onClipChange, navigateToNext]);

  const handleCancel = useCallback(() => { cancelCountdown(); }, [cancelCountdown]);
  const handleMiniClose = useCallback(() => { setShowMini(false); setMiniClosed(true); }, []);
  const handleMiniReturn = useCallback(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  // IntersectionObserver
  useEffect(() => {
    const el = inlinePlayerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (visible) { setShowMini(false); setMiniClosed(false); }
        else if (!miniClosed) { setShowMini(true); }
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [miniClosed]);

  const showModuleEnd = state === "ended" && !hasNextClip && !next;
  const showLessonCancelledEnd = state === "ended" && !hasNextClip && !!next;

  return (
    <PlayerUI
      clip={clip}
      clips={clips}
      currentClipIndex={currentClipIndex}
      module={module}
      moduleSlug={moduleSlug}
      next={next}
      upNextTitle={upNextTitle}
      isYouTube={true}
      youtubeHostRef={youtubeHostRef}
      countdownSec={countdownSec}
      isPlaying={isPlaying}
      countdownActive={countdownActive}
      pct={pct}
      countdownTotal={countdownTotal}
      showModuleEnd={showModuleEnd}
      showLessonCancelledEnd={showLessonCancelledEnd}
      showMini={showMini}
      portalMounted={portalMounted}
      svgId={svgId}
      reduced={reduced}
      onToggle={togglePlay}
      onPlayNow={handlePlayNow}
      onCancel={handleCancel}
      onMiniClose={handleMiniClose}
      onMiniReturn={handleMiniReturn}
      inlinePlayerRef={inlinePlayerRef}
    />
  );
}

// ---- LessonPlayer (controlled outer shell) ----
// Decides which clip sub-component to render. Reads session storage for
// autoplay intent and passes it down. The key prop on the sub-component
// ensures React re-mounts (and resets the hook) on every clip change.
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
  const clip = clips[currentClipIndex] ?? clips[0];
  const isYouTube = !!clip.videoId;

  // shouldAutoplay tracks two sources:
  // 1. A previous lesson set AUTOPLAY_KEY in sessionStorage (lessonAutoplay state).
  // 2. currentClipIndex changed from its previous value, meaning a clip advance
  //    or manual playlist selection (clipAutoplay state).
  //
  // Both are regular state so they can be read and set during/after render without
  // violating the react-hooks/refs rule.
  const [lessonAutoplay, setLessonAutoplay] = useState(false);
  const [prevClipIndex, setPrevClipIndex] = useState(currentClipIndex);
  const [clipAutoplay, setClipAutoplay] = useState(false);

  // Detect clip index changes during render using the React state-from-props pattern.
  // This is the canonical way to derive state from a changing prop.
  if (prevClipIndex !== currentClipIndex) {
    setPrevClipIndex(currentClipIndex);
    setClipAutoplay(true);
  }

  // Read sessionStorage autoplay flag once on lesson mount.
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem(AUTOPLAY_KEY);
      sessionStorage.removeItem(AUTOPLAY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (flag === lesson.id) setLessonAutoplay(true);
    } catch {
      // sessionStorage unavailable
    }
   
  }, [lesson.id]);

  // After the sub-component mounts with shouldAutoplay=true, reset both flags
  // so they do not fire again on subsequent renders.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lessonAutoplay) setLessonAutoplay(false);
     
    if (clipAutoplay) setClipAutoplay(false);
  // Re-run when clip index changes so flags reset after the new sub-component mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClipIndex]);

  const shouldAutoplay = lessonAutoplay || clipAutoplay;

  const sharedProps: ClipSubProps = {
    lesson,
    module,
    next,
    moduleSlug,
    clips,
    currentClipIndex,
    onClipChange,
    onClipWatched,
    shouldAutoplay,
  };

  // Key: re-mount sub-component on clip change so the hook resets cleanly.
  const subKey = `${lesson.id}-clip-${currentClipIndex}-${clip.id}`;

  if (isYouTube) {
    return <YouTubeClipPlayer key={subKey} {...sharedProps} />;
  }
  return <SimulatedClipPlayer key={subKey} {...sharedProps} />;
}
