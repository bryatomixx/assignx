"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/youtube";
import type { SimulatedPlayerAPI, PlayerState } from "@/lib/hooks/useSimulatedPlayer";

// How many seconds before the end triggers the "countdown" phase.
const COUNTDOWN_WINDOW = 5;

/**
 * useYouTubePlayer
 *
 * Wraps a YT.Player instance and exposes EXACTLY the same API as
 * useSimulatedPlayer (SimulatedPlayerAPI):
 *   { state, elapsed, durationSec, countdownSec,
 *     play, pause, togglePlay, cancelCountdown, confirmAutoplay, reset }
 *
 * State machine mirrors useSimulatedPlayer:
 *   idle -> playing -> countdown -> autoadvance
 *                   -> ended           (cancelCountdown)
 *   playing/countdown -> paused (manual or tab-hidden)
 *   paused -> playing (resume)
 *   any -> idle (reset)
 *
 * The YT.Player is created once per (containerRef, videoId) combination.
 * Changing videoId destroys the old player and creates a fresh one.
 * The component is responsible for providing a stable div ref as the host.
 *
 * Autoplay behaviour on auto-advance:
 *   The player transitions to "autoadvance" after the countdown. When the
 *   parent (LessonPlayer) calls onClipChange, the component is remounted,
 *   which creates a new YT.Player and calls play() -- that is user-gesture-
 *   scoped because the initial play was a user gesture. For clips auto-
 *   advancing without a gesture, we call playVideo() in muted mode if
 *   needed (playerVars: { mute: 0 }) and handle the case where the browser
 *   blocks it by leaving state as "paused" so the user sees a play button.
 */
export function useYouTubePlayer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  videoId: string,
): SimulatedPlayerAPI {
  const [state, setState] = useState<PlayerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [countdownSec, setCountdownSec] = useState(COUNTDOWN_WINDOW);

  // Internal refs to avoid stale closures
  const stateRef = useRef<PlayerState>("idle");
  const elapsedRef = useRef(0);
  const durationRef = useRef(0);
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userPausedRef = useRef(false);
  const destroyedRef = useRef(false);

  const syncState = useCallback((s: PlayerState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || destroyedRef.current) return;
      if (document.hidden) return;

      let cur: number;
      let dur: number;
      try {
        cur = p.getCurrentTime() ?? 0;
        dur = p.getDuration() ?? 0;
      } catch {
        return; // player may not be ready
      }

      if (dur > 0 && durationRef.current !== dur) {
        durationRef.current = dur;
        setDurationSec(dur);
      }

      elapsedRef.current = cur;
      setElapsed(cur);

      const remaining = dur - cur;

      if (cur >= dur && dur > 0) {
        // Reached end -- this should be caught by onStateChange ENDED,
        // but guard here too.
        clearTick();
        elapsedRef.current = dur;
        setElapsed(dur);
        setCountdownSec(0);
        syncState("autoadvance");
        return;
      }

      const countdownAt = dur - COUNTDOWN_WINDOW;
      if (cur >= countdownAt && dur > 0) {
        const remCeil = Math.max(1, Math.ceil(remaining));
        setCountdownSec(remCeil);
        if (stateRef.current === "playing") {
          syncState("countdown");
        } else if (stateRef.current === "countdown") {
          setCountdownSec(remCeil);
        }
      }
    }, 1000);
  }, [clearTick, syncState]);

  // ---- Public API ----

  const play = useCallback(() => {
    const cur = stateRef.current;
    if (cur === "ended" || cur === "autoadvance") return;
    userPausedRef.current = false;
    try {
      playerRef.current?.playVideo();
    } catch {
      // player not ready yet
    }
    // state will be set to "playing" in onStateChange
  }, []);

  const pause = useCallback(() => {
    const cur = stateRef.current;
    if (cur === "playing" || cur === "countdown") {
      userPausedRef.current = true;
      try {
        playerRef.current?.pauseVideo();
      } catch {
        // ignore
      }
      // state set to "paused" in onStateChange
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
    clearTick();
    try {
      playerRef.current?.pauseVideo();
    } catch {
      // ignore
    }
    setCountdownSec(COUNTDOWN_WINDOW);
    syncState("ended");
  }, [clearTick, syncState]);

  const confirmAutoplay = useCallback(() => {
    syncState("ended");
  }, [syncState]);

  const reset = useCallback(() => {
    clearTick();
    userPausedRef.current = false;
    elapsedRef.current = 0;
    setElapsed(0);
    setCountdownSec(COUNTDOWN_WINDOW);
    syncState("idle");
    try {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.pauseVideo();
    } catch {
      // ignore
    }
  }, [clearTick, syncState]);

  // ---- Tab visibility ----
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        const cur = stateRef.current;
        if (cur === "playing" || cur === "countdown") {
          userPausedRef.current = false; // visibility pause, not user pause
          clearTick();
          try { playerRef.current?.pauseVideo(); } catch { /* ignore */ }
          syncState("paused");
        }
      } else {
        if (stateRef.current === "paused" && !userPausedRef.current) {
          play();
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [play, clearTick, syncState]);

  // ---- Build the YT.Player when containerRef or videoId changes ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!videoId) return;

    destroyedRef.current = false;

    // Reset state for new video.
    clearTick();
    userPausedRef.current = false;
    elapsedRef.current = 0;
    durationRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsed(0);
     
    setDurationSec(0);
     
    setCountdownSec(COUNTDOWN_WINDOW);
    syncState("idle");

    let isCancelled = false;

    // Destroy any existing player before creating a new one
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    }

    loadYouTubeApi().then((YTApi) => {
      if (isCancelled || destroyedRef.current) return;

      // The YT.Player constructor needs a DOM element or element id.
      // We pass the container div directly.
      const player = new YTApi.Player(container, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 0, // we provide our own controls
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            if (isCancelled || destroyedRef.current) return;
            // The IFrame API replaces the host div with an <iframe> and sizes it
            // in pixels, which leaves gaps in the frame. Force it to fill.
            try {
              const iframe = player.getIframe();
              if (iframe) {
                iframe.style.position = "absolute";
                iframe.style.top = "0";
                iframe.style.left = "0";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "0";
              }
            } catch {
              // getIframe not available yet; ignore
            }
            const dur = player.getDuration();
            if (dur > 0) {
              durationRef.current = dur;
              setDurationSec(dur);
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (isCancelled || destroyedRef.current) return;
            switch (event.data) {
              case YT.PlayerState.PLAYING: {
                const dur = player.getDuration();
                if (dur > 0) {
                  durationRef.current = dur;
                  setDurationSec(dur);
                }
                startTick();
                // Only transition to "playing" if not already in countdown
                if (stateRef.current !== "countdown") {
                  syncState("playing");
                }
                break;
              }
              case YT.PlayerState.PAUSED: {
                // Avoid overwriting "countdown" or "autoadvance" with "paused"
                // if the YouTube player auto-pauses at end (some browsers do).
                const cur = stateRef.current;
                if (cur === "countdown" || cur === "autoadvance" || cur === "ended") break;
                clearTick();
                syncState("paused");
                break;
              }
              case YT.PlayerState.ENDED: {
                clearTick();
                elapsedRef.current = durationRef.current;
                setElapsed(durationRef.current);
                setCountdownSec(0);
                syncState("autoadvance");
                break;
              }
              case YT.PlayerState.BUFFERING: {
                // Stay in current state during buffering
                break;
              }
              case YT.PlayerState.CUED: {
                // Video cued but not playing -- stay idle
                break;
              }
            }
          },
          onError: (event: YT.OnErrorEvent) => {
            console.error("[useYouTubePlayer] YT.Player error", event.data);
          },
        },
      });

      if (isCancelled || destroyedRef.current) {
        try { player.destroy(); } catch { /* ignore */ }
        return;
      }

      playerRef.current = player;
    }).catch((err) => {
      console.error("[useYouTubePlayer] Failed to load YouTube API", err);
    });

    return () => {
      isCancelled = true;
      destroyedRef.current = true;
      clearTick();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  // containerRef is a stable ref object -- only videoId changes cause re-runs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

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
