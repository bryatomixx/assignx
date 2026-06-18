"use client";

import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Type,
  Video,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseVideo } from "@/lib/video";
import { cn } from "@/lib/utils";
import type { PostMediaType } from "@/lib/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const POST_MEDIA_BUCKET = "post-media";

export function PostComposer() {
  const { createPost } = useBoard();
  const { currentUser, isPaused } = useAcademy();

  const [body, setBody] = useState("");
  const [mediaType, setMediaType] = useState<PostMediaType>("text");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  // Video (link only -- never stored as a file, just the YouTube/Loom URL).
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  // Image (uploaded to Supabase Storage; we keep the resulting public URL).
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [posting, setPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const paused = isPaused();

  function resetMedia() {
    setLinkUrl("");
    setLinkError("");
    setVideoUrl("");
    setVideoError("");
    setImagePreview(null);
    setImageUrl(null);
    setImageError("");
    setUploading(false);
  }

  function handleMediaTab(type: PostMediaType) {
    setMediaType(type);
    resetMedia();
  }

  function validateLink(url: string): boolean {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setLinkError("URL must start with http:// or https://");
      return false;
    }
    setLinkError("");
    return true;
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    e.target.value = "";
    if (!file || !currentUser) return;

    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be under 5 MB.");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setImageUrl(null);
    setUploading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${currentUser.id}/${Date.now()}.${ext || "png"}`;
      const { error } = await sb.storage
        .from(POST_MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) {
        setImageError(`Upload failed: ${error.message}`);
        setImagePreview(null);
        return;
      }
      const { data } = sb.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setImageError(msg);
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
    setImageError("");
  }

  // Resolve the mediaPayload for the active tab, validating as needed. Returns
  // `false` when validation fails (caller should abort).
  function resolvePayload(): string | null | false {
    if (mediaType === "link") {
      const v = linkUrl.trim();
      if (v && !validateLink(v)) return false;
      return v || null;
    }
    if (mediaType === "video") {
      const v = videoUrl.trim();
      if (v && !parseVideo(v)) {
        setVideoError("Paste a YouTube or Loom link.");
        return false;
      }
      return v || null;
    }
    if (mediaType === "image") {
      return imageUrl; // null until an upload finished
    }
    return null;
  }

  function handlePost() {
    if (paused || posting || uploading) return;
    const mediaPayload = resolvePayload();
    if (mediaPayload === false) return;
    if (!body.trim() && !mediaPayload) return;

    setPosting(true);
    createPost({ body: body.trim(), mediaType, mediaPayload });
    setBody("");
    setMediaType("text");
    resetMedia();
    setPosting(false);
  }

  if (!currentUser) return null;

  const mediaOptions: { type: PostMediaType; label: string; Icon: typeof Type }[] = [
    { type: "text", label: "Text", Icon: Type },
    { type: "link", label: "Link", Icon: LinkIcon },
    { type: "image", label: "Image", Icon: ImageIcon },
    { type: "video", label: "Video", Icon: Video },
  ];

  const hasMedia =
    (mediaType === "image" && !!imageUrl) ||
    (mediaType === "video" && videoUrl.trim().length > 0) ||
    (mediaType === "link" && linkUrl.trim().length > 0);

  const canPost =
    !paused &&
    !posting &&
    !uploading &&
    body.trim().length <= 2000 &&
    (body.trim().length > 0 || hasMedia);

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar emoji={currentUser.avatar} name={currentUser.name} />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={paused}
            maxLength={2000}
            placeholder={
              paused
                ? "Reactivate your account to post"
                : "Share something with the community..."
            }
            rows={3}
            aria-label="Post content"
            className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[15px] text-ink-700 placeholder:text-ink-300 outline-none transition-colors focus:border-brand-300 focus:ring-1 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* Media type pills */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Post media type">
            {mediaOptions.map(({ type, label, Icon }) => (
              <button
                key={type}
                onClick={() => handleMediaTab(type)}
                disabled={paused}
                aria-pressed={mediaType === type}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                  paused
                    ? "cursor-not-allowed border-line bg-surface-2 text-ink-300 opacity-60"
                    : mediaType === type
                    ? "border-brand-100 bg-brand-50 text-brand-700"
                    : "border-line bg-white text-ink-500 hover:bg-surface-2 hover:text-ink-900",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Link URL input */}
          {mediaType === "link" && (
            <div className="mt-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  if (linkError) setLinkError("");
                }}
                placeholder="Paste a URL (https://...)"
                aria-label="Link URL"
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 outline-none transition-colors focus:ring-1",
                  linkError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-300"
                    : "border-line focus:border-brand-300 focus:ring-brand-300",
                )}
              />
              {linkError && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {linkError}
                </p>
              )}
            </div>
          )}

          {/* Video URL input (YouTube or Loom; not stored, only the link) */}
          {mediaType === "video" && (
            <div className="mt-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (videoError) setVideoError("");
                }}
                placeholder="Paste a YouTube or Loom link"
                aria-label="Video URL"
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 outline-none transition-colors focus:ring-1",
                  videoError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-300"
                    : "border-line focus:border-brand-300 focus:ring-brand-300",
                )}
              />
              {videoError ? (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {videoError}
                </p>
              ) : (
                <p className="mt-1 text-xs text-ink-300">
                  We only keep the link, the video stays on YouTube/Loom.
                </p>
              )}
            </div>
          )}

          {/* Image picker + preview (uploaded to storage) */}
          {mediaType === "image" && (
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                aria-hidden="true"
              />
              {imagePreview ? (
                <div className="relative inline-block overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Selected image preview"
                    className="block max-h-64 w-auto"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={removeImage}
                      aria-label="Remove image"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={paused}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-2 px-4 py-6 text-sm font-medium text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ImageIcon className="h-4 w-4" />
                  Choose an image (up to 5 MB)
                </button>
              )}
              {imageError && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {imageError}
                </p>
              )}
            </div>
          )}

          {/* Post button */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePost}
              disabled={!canPost}
              aria-disabled={!canPost}
            >
              {uploading ? "Uploading..." : posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
