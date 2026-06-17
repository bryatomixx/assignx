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
import { Maximize2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useSimulatedPlayer } from "@/lib/hooks/useSimulatedPlayer";
import { useYouTubePlayer } from "@/lib/hooks/useYouTubePlayer";
import { useAcademy } from "@/lib/store/AcademyProvider";
import type { Clip, Lesson, Module } from "@/lib/types";

// Key used to signal autoplay on mount to the next lesson
const AUTOPLAY_KEY = "assignx:autoplay";

// ---- Helpers ----
function formatTime(sec: number): string {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

// ---- Seekable progress bar ----
// Renders an interactive track + thumb. Accepts click and pointer-drag.
// Accessible via role=slider + arrow keys (+/- 5s).
function SeekBar({
  elapsed,
  durationSec,
  pct,
  onSeek,
  compact = false,
}: {
  elapsed: number;
  durationSec: number;
  pct: number;
  onSeek: (seconds: number) => void;
  compact?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [localPct, setLocalPct] = useState<number | null>(null);

  const clampedPct = localPct !== null ? localPct : Math.min(pct, 100);

  const pctFromPointer = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const commitSeek = useCallback((frac: number) => {
    const dur = durationSec || 1;
    onSeek(frac * dur);
    setLocalPct(null);
  }, [durationSec, onSeek]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const frac = pctFromPointer(e.clientX);
    setLocalPct(frac * 100);
    setDragging(true);
  }, [pctFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const frac = pctFromPointer(e.clientX);
    setLocalPct(frac * 100);
  }, [dragging, pctFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const frac = pctFromPointer(e.clientX);
    setDragging(false);
    commitSeek(frac);
  }, [dragging, pctFromPointer, commitSeek]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const dur = durationSec || 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onSeek(Math.min(elapsed + 5, dur));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onSeek(Math.max(elapsed - 5, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSeek(dur);
    }
  }, [elapsed, durationSec, onSeek]);

  const showThumb = hovered || dragging;

  return (
    <div className={cn("flex items-center gap-2 w-full", compact ? "px-2" : "px-4")}>
      {!compact && (
        <span className="text-[10px] font-mono text-white/70 shrink-0 tabular-nums min-w-[28px]">
          {formatTime(elapsed)}
        </span>
      )}
      {/* Hit area: tall enough for comfortable interaction */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationSec) || 100}
        aria-valuenow={Math.round(elapsed)}
        aria-valuetext={`${formatTime(elapsed)} of ${formatTime(durationSec)}`}
        tabIndex={0}
        className={cn(
          "relative flex-1 flex items-center cursor-pointer select-none",
          "rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white",
          compact ? "h-3" : "h-4",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!dragging) setHovered(false); }}
        onKeyDown={handleKeyDown}
      >
        {/* Track */}
        <div className={cn("absolute inset-x-0 rounded-full bg-white/20", compact ? "h-1" : "h-1.5")} style={{ top: "50%", transform: "translateY(-50%)" }}>
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${clampedPct}%`,
              background: "linear-gradient(90deg, #7802df, #ff0bd6)",
            }}
          />
        </div>
        {/* Thumb: always in DOM but opacity-animated for smooth appearance */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute rounded-full bg-white shadow-md transition-opacity duration-150",
            compact ? "h-3 w-3" : "h-4 w-4",
            showThumb ? "opacity-100" : "opacity-0",
          )}
          style={{
            left: `clamp(0px, calc(${clampedPct}% - ${compact ? "6px" : "8px"}), calc(100% - ${compact ? "12px" : "16px"}))`,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      </div>
      {!compact && (
        <span className="text-[10px] font-mono text-white/70 shrink-0 tabular-nums min-w-[28px] text-right">
          {formatTime(durationSec)}
        </span>
      )}
    </div>
  );
}

// ---- Volume control ----
// Shows a mute toggle + horizontal slider. Only rendered for YouTube clips.
function VolumeControl({
  volume,
  muted,
  onSetVolume,
  onToggleMute,
  compact = false,
}: {
  volume: number;
  muted: boolean;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  compact?: boolean;
}) {
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hide slider when clicking outside
  useEffect(() => {
    if (!showSlider) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowSlider(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSlider]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center gap-1", compact ? "gap-0.5" : "gap-1")}
    >
      <button
        onClick={() => {
          onToggleMute();
          setShowSlider((v) => !v);
        }}
        aria-label={muted ? "Unmute" : "Mute"}
        className={cn(
          "flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white",
          compact ? "h-7 w-7" : "h-8 w-8",
        )}
      >
        {muted || volume === 0 ? (
          <VolumeX className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        ) : (
          <Volume2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        )}
      </button>

      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: compact ? 64 : 80 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => {
                const val = Number(e.target.value);
                onSetVolume(val);
                if (val > 0 && muted) onToggleMute(); // unmute when dragging up
              }}
              className={cn(
                "w-full cursor-pointer appearance-none rounded-full bg-white/20",
                "h-1.5",
                // Thumb styling via Tailwind arbitrary
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
                "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full",
                "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer",
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * LessonPlayer is a CONTROLLED component.
 *
 * For each clip there are two possible sub-components:
 *   - SimulatedClipPlayer: uses useSimulatedPlayer (placeholder gradient)
 *   - YouTubeClipPlayer:   uses useYouTubePlayer (real IFrame API)
 *
 * Both sub-components receive all the props they need to render the full UI
 * (overlays, floating player, progress bar). This avoids conditional hook calls
 * because each sub-component always calls exactly one hook. React re-mounts
 * the sub-component when currentClipIndex changes (via the "key" prop on the
 * sub-component), giving each clip a fresh hook instance.
 *
 * FLOATING PLAYER (Technique B - portal + placeholder):
 *   The player surface is rendered once via createPortal to document.body,
 *   escaping the ancestor motion.div that applies transform: translateY(...).
 *   A placeholder div in the normal flow reserves the space.
 *   The surface uses position:fixed and tracks the placeholder rect on scroll
 *   (docked mode) or snaps to bottom-right (floating mode).
 *   The YouTube iframe host div lives INSIDE the portal surface and is NEVER
 *   moved, remounted, or conditionally rendered -- so the iframe never reloads.
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

// ---- Rect tracked by the portal surface ----
interface SurfaceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ---- Shared player surface content ----
// Renders overlays, controls, iframe host, etc.
// Used by both the docked and floating states -- same markup, same refs.
function PlayerSurface({
  clip,
  clips,
  currentClipIndex,
  module,
  moduleSlug,
  upNextTitle,
  isYouTube,
  youtubeHostRef,
  countdownSec,
  isPlaying,
  countdownActive,
  pct,
  elapsed,
  durationSec,
  countdownTotal,
  showModuleEnd,
  svgId,
  reduced,
  isFloating,
  onToggle,
  onPlayNow,
  onCancel,
  onClose,
  onReturn,
  onSeek,
  volume,
  muted,
  onSetVolume,
  onToggleMute,
}: {
  clip: Clip;
  clips: Clip[];
  currentClipIndex: number;
  module: Module;
  moduleSlug: string;
  upNextTitle: string | null;
  isYouTube: boolean;
  youtubeHostRef?: React.RefObject<HTMLDivElement | null>;
  countdownSec: number;
  isPlaying: boolean;
  countdownActive: boolean;
  pct: number;
  elapsed: number;
  durationSec: number;
  countdownTotal: number;
  showModuleEnd: boolean;
  svgId: string;
  reduced: boolean;
  isFloating: boolean;
  onToggle: () => void;
  onPlayNow: () => void;
  onCancel: () => void;
  onClose: () => void;
  onReturn: () => void;
  onSeek: (seconds: number) => void;
  volume: number;
  muted: boolean;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl border border-line">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-95"
        style={{ backgroundImage: module.accent }}
      />
      <div className="absolute inset-0 bg-black/20" />

      {/* YouTube iframe host. YT.Player attaches here. NEVER moved or remounted. */}
      {isYouTube && youtubeHostRef && (
        <div
          ref={youtubeHostRef}
          className="absolute inset-0 z-0 [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:border-0"
          aria-label="YouTube video player"
        />
      )}

      {/* Branded cover over the YouTube iframe while paused or idle. Hides
          YouTube native overlay so there is only one set of controls. */}
      {isYouTube && !isPlaying && (
        <div className="absolute inset-0 z-[5]" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-95"
            style={{ backgroundImage: module.accent }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Floating mode: top bar with expand and close */}
      {isFloating && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center px-2 pt-1.5 pb-3 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={onReturn}
            aria-label="Return to player"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <p className="flex-1 mx-1 text-xs font-medium text-white/90 truncate">{clip.title}</p>
          <button
            onClick={onClose}
            aria-label="Close player"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Play/pause button (shown when not in countdown and not floating with active countdown) */}
      {!countdownActive && (
        <button
          onClick={onToggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={cn(
            "absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white",
            isFloating ? "h-12 w-12" : "h-16 w-16",
          )}
        >
          {isPlaying ? (
            <Pause className={cn(isFloating ? "h-5 w-5" : "h-7 w-7")} fill="white" stroke="white" />
          ) : (
            <Play className={cn(isFloating ? "h-5 w-5 translate-x-0.5" : "h-7 w-7 translate-x-0.5")} fill="white" stroke="none" />
          )}
        </button>
      )}

      {/* Countdown mini controls (floating mode) */}
      {isFloating && countdownActive && upNextTitle && (
        <div className="relative z-10 flex items-center gap-3 px-3">
          <CountdownRing
            sec={countdownSec} total={countdownTotal}
            svgId={`${svgId}-float`} reduced={reduced}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Up next</p>
            <p className="text-xs font-medium text-white truncate">{upNextTitle}</p>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={onPlayNow}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                Play now
              </button>
              <button
                onClick={onCancel}
                className="text-[11px] px-2.5 py-1 rounded-md text-white/70 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls row */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 z-10 flex flex-col gap-0 bg-gradient-to-t from-black/60 to-transparent",
        isFloating ? "pb-1.5 pt-0.5" : "pb-2 pt-8",
      )}>
        {!isFloating && (
          <div className="flex items-center gap-2 px-3 pb-0.5">
            {isYouTube && (
              <VolumeControl
                volume={volume}
                muted={muted}
                onSetVolume={onSetVolume}
                onToggleMute={onToggleMute}
              />
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          <SeekBar
            elapsed={elapsed}
            durationSec={durationSec}
            pct={pct}
            onSeek={onSeek}
            compact={isFloating}
          />
          {isFloating && isYouTube && (
            <div className="shrink-0 pr-1">
              <VolumeControl
                volume={volume}
                muted={muted}
                onSetVolume={onSetVolume}
                onToggleMute={onToggleMute}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* Countdown overlay (docked / full size) */}
      {!isFloating && (
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
      )}

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

      {/* Now-playing label (docked only -- no room in floating) */}
      {!isFloating && (
        <div className="absolute bottom-14 left-4 right-4 z-10 flex items-end justify-between pointer-events-none">
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
      )}

      {/* YouTube source badge */}
      {isYouTube && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/70 backdrop-blur">
            YouTube
          </span>
        </div>
      )}
    </div>
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

// ---- useFloatingPlayer hook ----
// Manages the portal-based floating/docked behaviour (Technique B).
// placeholderRef: the div in normal flow that reserves space.
// Returns: portalMounted, docked, floating, surfaceStyle, and event handlers.
function useFloatingPlayer() {
  const [portalMounted, setPortalMounted] = useState(false);
  const [docked, setDocked] = useState(true);
  const [closed, setClosed] = useState(false);
  // surfaceRect tracks the placeholder's position relative to the viewport
  const [surfaceRect, setSurfaceRect] = useState<SurfaceRect>({ top: 0, left: 0, width: 0, height: 0 });
  const placeholderRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPortalMounted(true); }, []);

  // Measure placeholder rect and push to state. Called on every scroll frame
  // when docked, and once when switching modes.
  const measureRect = useCallback(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSurfaceRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  // Scroll listener: update rect every animation frame (passive, no jitter).
  useEffect(() => {
    if (!docked) return; // only needed while docked
    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        measureRect();
        rafRef.current = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Measure immediately on mount / mode change
    measureRect();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [docked, measureRect]);

  // ResizeObserver: re-measure when placeholder size changes
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { measureRect(); });
    ro.observe(el);
    measureRect();
    return () => ro.disconnect();
  }, [measureRect]);

  // closedRef keeps a stable reference to the current closed value so the
  // IntersectionObserver callback never captures a stale closure.
  const closedRef = useRef(closed);
  useEffect(() => { closedRef.current = closed; }, [closed]);

  // IntersectionObserver: switch between docked/floating.
  // Reads closedRef (not closed) so it never needs to be re-registered on
  // closed changes, avoiding unnecessary disconnect/reconnect cycles.
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Ignore measurements taken before the placeholder is laid out. Inside a
        // CSS grid the `1fr` column can resolve its width a frame late, so the
        // first callback may report a zero-size box (ratio 0 -> "not visible").
        // Acting on that would latch the player into floating mode and, because
        // a stably-visible element fires no further threshold crossing, it would
        // never re-dock. Skipping zero-size entries keeps it docked on load.
        const r = entry.boundingClientRect;
        if (r.width === 0 || r.height === 0) return;
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (visible) {
          setDocked(true);
          setClosed(false);
        } else if (!closedRef.current) {
          setDocked(false);
        }
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  // placeholderRef is a stable ref object. closedRef is stable. Empty deps = mount only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setClosed(true);
    setDocked(false);
  }, []);

  const handleReturn = useCallback(() => {
    setClosed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Build the CSS style for the portal surface.
  // Docked: follows the placeholder exactly (no transition while scrolling).
  // Floating: snaps to bottom-right with CSS transition.
  const isVisible = docked || (!closed && !docked);
  const isFloating = !docked && !closed;

  const surfaceStyle: React.CSSProperties = docked
    ? {
        position: "fixed",
        top: surfaceRect.top,
        left: surfaceRect.left,
        width: surfaceRect.width,
        height: surfaceRect.height,
        zIndex: 40,
        borderRadius: "1.5rem", // rounded-3xl
        transition: "none",
      }
    : {
        position: "fixed",
        bottom: 20,
        right: 20,
        top: "auto",
        left: "auto",
        width: "clamp(280px, 30vw, 360px)",
        height: "auto",
        aspectRatio: "16/9",
        zIndex: 50,
        borderRadius: "1rem",
        transition: "width 0.3s ease, bottom 0.3s ease, right 0.3s ease, border-radius 0.3s ease",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      };

  return {
    portalMounted,
    placeholderRef,
    isVisible,
    isFloating,
    surfaceStyle,
    handleClose,
    handleReturn,
  };
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
  const { state, elapsed, durationSec, countdownSec, togglePlay, cancelCountdown, seekTo, volume, muted, setVolume, toggleMute } = player;

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

  // ---- Autoplay on mount ----
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

  // ---- Floating player state ----
  const {
    portalMounted,
    placeholderRef,
    isVisible,
    isFloating,
    surfaceStyle,
    handleClose,
    handleReturn,
  } = useFloatingPlayer();

  const showModuleEnd = state === "ended" && !hasNextClip && !next;
  const showLessonCancelledEnd = state === "ended" && !hasNextClip && !!next;

  const surface = (
    <PlayerSurface
      clip={clip}
      clips={clips}
      currentClipIndex={currentClipIndex}
      module={module}
      moduleSlug={moduleSlug}
      upNextTitle={upNextTitle}
      isYouTube={false}
      countdownSec={countdownSec}
      isPlaying={isPlaying}
      countdownActive={countdownActive}
      pct={pct}
      elapsed={elapsed}
      durationSec={durationSec}
      countdownTotal={countdownTotal}
      showModuleEnd={showModuleEnd}
      svgId={svgId}
      reduced={reduced}
      isFloating={isFloating}
      onToggle={togglePlay}
      onPlayNow={handlePlayNow}
      onCancel={handleCancel}
      onClose={handleClose}
      onReturn={handleReturn}
      onSeek={seekTo}
      volume={volume}
      muted={muted}
      onSetVolume={setVolume}
      onToggleMute={toggleMute}
    />
  );

  return (
    <>
      {/* Placeholder: reserves aspect-video space in the normal flow */}
      <div ref={placeholderRef} className="aspect-video w-full" aria-hidden="true" />

      {/* Portal: the single surface, mounted once, never remounted */}
      {portalMounted && createPortal(
        <>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isFloating ? `Floating player active: ${clip.title}` : ""}
          </div>
          {isVisible && (
            <div style={surfaceStyle}>
              {surface}
            </div>
          )}
        </>,
        document.body,
      )}

      {/* Lesson-complete banner */}
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
    </>
  );
}

// ---- YouTubeClipPlayer ----
// Always calls useYouTubePlayer. Handles all player logic for YouTube clips.
// The YouTube iframe host (youtubeHostRef) lives INSIDE the portal surface,
// so it is never moved in the DOM when switching between docked/floating.
// This guarantees the iframe never reloads.
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

  // Floating player state. Declared BEFORE the YT player hook so player
  // creation can be gated on the surface (and its host div) being mounted.
  const {
    portalMounted,
    placeholderRef,
    isVisible,
    isFloating,
    surfaceStyle,
    handleClose,
    handleReturn,
  } = useFloatingPlayer();

  const player = useYouTubePlayer(
    youtubeHostRef,
    clip.video!.id,
    portalMounted && isVisible,
  );
  const { state, elapsed, durationSec, countdownSec, togglePlay, cancelCountdown, seekTo, volume, muted, setVolume, toggleMute } = player;

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

  // ---- Autoplay on mount ----
  const autoplayFiredRef = useRef(false);
  useEffect(() => {
    if (!shouldAutoplay || autoplayFiredRef.current) return;
    if (state === "idle") {
      autoplayFiredRef.current = true;
      player.play();
    }
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

  const showModuleEnd = state === "ended" && !hasNextClip && !next;
  const showLessonCancelledEnd = state === "ended" && !hasNextClip && !!next;

  // The surface contains the youtubeHostRef div. It is rendered ONCE inside the
  // portal and never unmounted by scroll/mode changes. The YT.Player (created
  // by useYouTubePlayer) holds a reference to that DOM node and continues
  // operating without interruption regardless of position:fixed changes.
  const surface = (
    <PlayerSurface
      clip={clip}
      clips={clips}
      currentClipIndex={currentClipIndex}
      module={module}
      moduleSlug={moduleSlug}
      upNextTitle={upNextTitle}
      isYouTube={true}
      youtubeHostRef={youtubeHostRef}
      countdownSec={countdownSec}
      isPlaying={isPlaying}
      countdownActive={countdownActive}
      pct={pct}
      elapsed={elapsed}
      durationSec={effectiveDuration}
      countdownTotal={countdownTotal}
      showModuleEnd={showModuleEnd}
      svgId={svgId}
      reduced={reduced}
      isFloating={isFloating}
      onToggle={togglePlay}
      onPlayNow={handlePlayNow}
      onCancel={handleCancel}
      onClose={handleClose}
      onReturn={handleReturn}
      onSeek={seekTo}
      volume={volume}
      muted={muted}
      onSetVolume={setVolume}
      onToggleMute={toggleMute}
    />
  );

  return (
    <>
      {/* Placeholder: reserves aspect-video space in the normal flow */}
      <div ref={placeholderRef} className="aspect-video w-full" aria-hidden="true" />

      {/* Portal: the single surface, mounted once, never remounted.
          The youtubeHostRef div (and thus the YT iframe) lives here.
          Changing position:fixed coords does NOT move the node in the React
          tree or the DOM tree -- the browser only repaints. No iframe reload. */}
      {portalMounted && createPortal(
        <>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isFloating ? `Floating player active: ${clip.title}` : ""}
          </div>
          {isVisible && (
            <div style={surfaceStyle}>
              {surface}
            </div>
          )}
        </>,
        document.body,
      )}

      {/* Lesson-complete banner (in flow, below the placeholder) */}
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
    </>
  );
}

// ---- LoomClipPlayer ----
// Loom does not expose YouTube's IFrame playback API, so (per the chosen
// "clean embed" approach) it renders Loom's native player inside the same
// branded frame: no custom overlay, no progress bar, no autoadvance/countdown,
// no floating. Advancing between chapters and marking the lesson complete are
// manual. Rendered in normal flow (no portal), so the floating machinery never
// runs for Loom clips.
function LoomClipPlayer({ clips, currentClipIndex }: ClipSubProps) {
  const clip = clips[currentClipIndex] ?? clips[0];
  const src = `https://www.loom.com/embed/${clip.video!.id}`;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-line bg-black">
      <iframe
        key={clip.id}
        src={src}
        title={clip.title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/70 backdrop-blur">
          Loom
        </span>
      </div>
    </div>
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
  const provider = clip.video?.provider;

  // shouldAutoplay tracks two sources:
  // 1. A previous lesson set AUTOPLAY_KEY in sessionStorage (lessonAutoplay state).
  // 2. currentClipIndex changed from its previous value, meaning a clip advance
  //    or manual playlist selection (clipAutoplay state).
  const [lessonAutoplay, setLessonAutoplay] = useState(false);
  const [prevClipIndex, setPrevClipIndex] = useState(currentClipIndex);
  const [clipAutoplay, setClipAutoplay] = useState(false);

  // Detect clip index changes during render using the React state-from-props pattern.
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

  // After the sub-component mounts with shouldAutoplay=true, reset both flags.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lessonAutoplay) setLessonAutoplay(false);
    if (clipAutoplay) setClipAutoplay(false);
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

  if (provider === "youtube") {
    return <YouTubeClipPlayer key={subKey} {...sharedProps} />;
  }
  if (provider === "loom") {
    return <LoomClipPlayer key={subKey} {...sharedProps} />;
  }
  return <SimulatedClipPlayer key={subKey} {...sharedProps} />;
}
