"use client";

import { useState } from "react";
import { Image as ImageIcon, Link as LinkIcon, Type, Video } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";
import type { PostMediaType } from "@/lib/types";

export function PostComposer() {
  const { createPost } = useBoard();
  const { currentUser, isPaused } = useAcademy();

  const [body, setBody] = useState("");
  const [mediaType, setMediaType] = useState<PostMediaType>("text");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [posting, setPosting] = useState(false);

  const paused = isPaused();

  function handleMediaTab(type: PostMediaType) {
    setMediaType(type);
    setLinkError("");
    if (type !== "link") setLinkUrl("");
  }

  function validateLink(url: string): boolean {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setLinkError("URL must start with http:// or https://");
      return false;
    }
    setLinkError("");
    return true;
  }

  async function handlePost() {
    if (!body.trim() || paused || posting) return;
    if (mediaType === "link" && linkUrl.trim()) {
      if (!validateLink(linkUrl.trim())) return;
    }
    setPosting(true);
    createPost({
      body: body.trim(),
      mediaType,
      mediaPayload: mediaType === "link" ? (linkUrl.trim() || null) : null,
    });
    setBody("");
    setLinkUrl("");
    setMediaType("text");
    setLinkError("");
    setPosting(false);
  }

  if (!currentUser) return null;

  const mediaOptions: { type: PostMediaType; label: string; Icon: typeof Type; disabled: boolean }[] = [
    { type: "text", label: "Text", Icon: Type, disabled: false },
    { type: "link", label: "Link", Icon: LinkIcon, disabled: false },
    { type: "image", label: "Image (soon)", Icon: ImageIcon, disabled: true },
    { type: "video", label: "Video (soon)", Icon: Video, disabled: true },
  ];

  const canPost = body.trim().length > 0 && body.trim().length <= 2000 && !paused && !posting;

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar emoji={currentUser.avatar} />
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
            {mediaOptions.map(({ type, label, Icon, disabled }) => (
              <button
                key={type}
                onClick={() => !disabled && handleMediaTab(type)}
                disabled={disabled}
                aria-pressed={mediaType === type}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                  disabled
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

          {/* Post button */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePost}
              disabled={!canPost}
              aria-disabled={!canPost}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
