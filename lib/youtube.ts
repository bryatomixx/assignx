/**
 * lib/youtube.ts
 *
 * Singleton loader for the YouTube IFrame Player API.
 * Safe to call multiple times -- the script is only injected once and the
 * promise resolves for every caller once the API is ready.
 *
 * SSR-safe: all DOM/window access is guarded by typeof checks and only runs
 * inside the Promise executor (which never executes during SSR because the
 * module is only imported in 'use client' files).
 */

let ytApiPromise: Promise<typeof YT> | null = null;

export function loadYouTubeApi(): Promise<typeof YT> {
  // Return the in-flight (or resolved) promise if we already started.
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<typeof YT>((resolve, reject) => {
    // Should never be called server-side, but guard just in case.
    if (typeof window === "undefined") {
      reject(new Error("YouTube IFrame API requires a browser environment"));
      return;
    }

    // If the API is already loaded (e.g. hot-reload), resolve immediately.
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    // Wire the global callback that YouTube calls once the script is ready.
    // We only set it if it is not already set (another call racing us).
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      // Chain any previously registered callback so nothing is dropped.
      if (typeof prevCallback === "function") prevCallback();
      resolve(window.YT);
    };

    // Inject the script tag only if it is not already in the document.
    const existing = document.querySelector(
      'script[src*="youtube.com/iframe_api"]',
    );
    if (existing) return; // script already injected; callback will fire

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      ytApiPromise = null; // allow retry on next call
      reject(new Error("Failed to load YouTube IFrame API"));
    };
    document.head.appendChild(script);
  });

  return ytApiPromise;
}
