/**
 * Video provider parsing.
 *
 * Content authors paste a normal share/watch URL (YouTube or Loom) into a
 * single `video` field. parseVideo() detects the provider and extracts the id;
 * the UI then decides how to render it:
 *   - youtube -> rich custom player (YT IFrame API: progress, autoadvance, float)
 *   - loom    -> clean native embed (Loom's own controls, no custom overlay)
 *
 * Keeping a single URL field means nobody has to know about providers when
 * authoring lessons.
 */

export type VideoProvider = "youtube" | "loom";

export interface VideoSource {
  provider: VideoProvider;
  id: string;
}

// youtu.be/<id> | youtube.com/watch?v=<id> | /embed/<id> | /shorts/<id> | /live/<id>
const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

// loom.com/share/<id> | loom.com/embed/<id>  (id is a 32-char hex)
const LOOM_RE = /loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/;

/**
 * Parse a YouTube or Loom URL into a provider + id. Returns null when the URL
 * is empty or unrecognised (caller falls back to the simulated player).
 */
export function parseVideo(url: string | undefined | null): VideoSource | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = trimmed.match(YOUTUBE_RE);
  if (yt) return { provider: "youtube", id: yt[1] };

  const loom = trimmed.match(LOOM_RE);
  if (loom) return { provider: "loom", id: loom[1] };

  return null;
}

/** The iframe `src` for a plain embed of either provider. */
export function toEmbedUrl(source: VideoSource): string {
  return source.provider === "loom"
    ? `https://www.loom.com/embed/${source.id}`
    : `https://www.youtube.com/embed/${source.id}`;
}
