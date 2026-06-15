"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// "autoadvance" = countdown hit 0 naturally, caller should navigate
export type PlayerState =
  | "idle"
  | "playing"
  | "paused"
  | "countdown"
  | "autoadvance"
  | "ended";

export interface SimulatedPlayerAPI {
  state: PlayerState;
  elapsed: number;       // seconds elapsed, 0..durationSec
  durationSec: number;
  /** 5 when countdown starts, counts down to 0 */
  countdownSec: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  cancelCountdown: () => void;
  /** Call this to signal the caller navigated manually (Play now button) */
  confirmAutoplay: () => void;
  /** Reset to idle at elapsed=0 (used when switching clips in-place). */
  reset: () => void;
}

const DURATION = 20;
// Countdown begins 5 seconds before the end of the clip.
const COUNTDOWN_WINDOW = 5;

/**
 * Simulates a video player with idle/playing/paused/countdown/autoadvance/ended
 * states. The timer pauses when the tab is hidden (and auto-resumes if the
 * user had not manually paused). Designed so swapping in a real <video> later
 * is minimal: replace the interval-based timer with video element event listeners.
 *
 * State machine:
 *   idle -> playing -> countdown -> autoadvance  (natural end, next clip/lesson exists)
 *                   -> ended                     (cancelCountdown, or last item)
 *   playing/countdown -> paused (manual or visibility)
 *   paused -> playing (resume)
 *   any -> idle (reset)
 */
export function useSimulatedPlayer(durationSec = DURATION): SimulatedPlayerAPI {
  const [state, setState] = useState<PlayerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [countdownSec, setCountdownSec] = useState(COUNTDOWN_WINDOW);

  // Internal refs to avoid stale closures in the interval
  const elapsedRef = useRef(0);
  const stateRef = useRef<PlayerState>("idle");
  // Tracks whether the most recent pause was triggered by the user (manual)
  // vs. by the visibility API. Used to decide whether to auto-resume.
  const userPausedRef = useRef(false);

  // The threshold (elapsed seconds) at which countdown starts
  const countdownAt = durationSec - COUNTDOWN_WINDOW;

  const syncState = (s: PlayerState) => {
    stateRef.current = s;
    setState(s);
  };

  const play = useCallback(() => {
    if (stateRef.current === "ended" || stateRef.current === "autoadvance") return;
    userPausedRef.current = false;
    syncState("playing");
  }, []);

  const pause = useCallback(() => {
    const cur = stateRef.current;
    if (cur === "playing" || cur === "countdown") {
      userPausedRef.current = true;
      syncState("paused");
    }
  }, []);

  const togglePlay = useCallback(() => {
    const cur = stateRef.current;
    if (cur === "idle" || cur === "paused") {
      play();
    } else if (cur === "playing" || cur === "countdown") {
      pause();
    }
  }, [play, pause]);

  const cancelCountdown = useCallback(() => {
    // Cancel moves from countdown -> ended without navigation
    syncState("ended");
    setCountdownSec(COUNTDOWN_WINDOW);
  }, []);

  const confirmAutoplay = useCallback(() => {
    // Caller used "Play now": mark as ended (navigation handled by caller)
    syncState("ended");
  }, []);

  const reset = useCallback(() => {
    elapsedRef.current = 0;
    userPausedRef.current = false;
    setElapsed(0);
    setCountdownSec(COUNTDOWN_WINDOW);
    syncState("idle");
  }, []);

  // Tick every 200ms for smooth progress, only when actively running
  useEffect(() => {
    if (state !== "playing" && state !== "countdown") return;

    const tick = () => {
      // Pause if tab is hidden (without marking as user-paused)
      if (document.hidden) return;

      elapsedRef.current = Math.min(elapsedRef.current + 0.2, durationSec);
      setElapsed(elapsedRef.current);

      if (elapsedRef.current >= durationSec) {
        // Reached the natural end of the countdown
        elapsedRef.current = durationSec;
        setCountdownSec(0);
        // Signal "autoadvance" so LessonPlayer knows to navigate or advance clip
        syncState("autoadvance");
        return;
      }

      if (elapsedRef.current >= countdownAt && stateRef.current === "playing") {
        // Enter countdown phase
        const remaining = Math.ceil(durationSec - elapsedRef.current);
        setCountdownSec(Math.max(1, remaining));
        syncState("countdown");
      } else if (stateRef.current === "countdown") {
        const remaining = Math.ceil(durationSec - elapsedRef.current);
        setCountdownSec(Math.max(1, remaining));
      }
    };

    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [state, durationSec, countdownAt]);

  // Pause/resume based on tab visibility
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        const cur = stateRef.current;
        if (cur === "playing" || cur === "countdown") {
          // Visibility-triggered pause: do NOT set userPausedRef
          userPausedRef.current = false;
          syncState("paused");
        }
      } else {
        // Tab became visible again: resume only if paused by visibility (not by user)
        if (stateRef.current === "paused" && !userPausedRef.current) {
          syncState("playing");
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return {
    state,
    elapsed,
    durationSec,
    countdownSec,
    play,
    pause,
    togglePlay,
    cancelCountdown,
    confirmAutoplay,
    reset,
  };
}
