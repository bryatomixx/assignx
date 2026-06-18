"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { parseVideo, toEmbedUrl } from "@/lib/video";

/**
 * PostVideo renders a community post's video link (YouTube or Loom). The video
 * itself is never stored: only the URL lives in the post. We show a lightweight
 * preview (a thumbnail for YouTube, a branded card for Loom) plus the source
 * link, and only mount the embed iframe once the user clicks play, so a feed
 * full of videos does not load N iframes at once.
 */
export function PostVideo({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const video = parseVideo(url);

  // Unrecognized provider: fall back to a plain external link.
  if (!video) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-medium text-brand-500 transition-colors hover:border-brand-100 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="truncate">{url}</span>
      </a>
    );
  }

  const isYouTube = video.provider === "youtube";
  const providerLabel = isYouTube ? "YouTube" : "Loom";

  if (playing) {
    const src = `${toEmbedUrl(video)}?autoplay=1`;
    return (
      <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
        <iframe
          src={src}
          title="Video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  const thumb = isYouTube
    ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
    : null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play ${providerLabel} video`}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-line bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "linear-gradient(135deg,#7802DF,#FF0BD6)" }}
          />
        )}
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 backdrop-blur transition-transform group-hover:scale-105">
          <Play className="h-6 w-6 translate-x-0.5 text-white" fill="white" stroke="none" />
        </span>
        <span className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur">
          {providerLabel}
        </span>
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        <span className="truncate">Watch on {providerLabel}</span>
      </a>
    </div>
  );
}
