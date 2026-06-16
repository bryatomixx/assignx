"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Trash2,
  UserCheck,
  UserPlus,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Share2,
  Check,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { CommentThread } from "@/components/community/CommentThread";
import { UserNameButton } from "@/components/community/UserPreviewCard";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn, relativeTime, isSafeUrl } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const {
    likeCount,
    isLiked,
    commentCount,
    likePost,
    unlikePost,
    deletePost,
    pinPost,
    unpinPost,
    follow,
    unfollow,
    isFollowing,
    canDeletePost,
    canPinContent,
    roleOf,
  } = useBoard();
  const { currentUser, users, isPaused } = useAcademy();

  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const author = users.find((u) => u.id === post.authorId);
  const role = roleOf(post.authorId);
  const liked = isLiked(post.id);
  const likes = likeCount(post.id);
  const comments = commentCount(post.id);
  const following = isFollowing(post.authorId);
  const isSelf = currentUser?.id === post.authorId;
  const paused = isPaused();
  const canDel = canDeletePost(post.id);
  const canPin = canPinContent();
  const showMenu = canDel || canPin;

  // Body truncation: ~4 lines = roughly 300 chars
  const TRUNC_LEN = 300;
  const shouldTruncate = post.body.length > TRUNC_LEN;
  const bodyDisplay =
    shouldTruncate && !expanded
      ? post.body.slice(0, TRUNC_LEN) + "..."
      : post.body;

  function handleLike() {
    if (paused) return;
    if (liked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  }

  function handleFollow() {
    if (paused || isSelf) return;
    if (following) {
      unfollow(post.authorId);
    } else {
      follow(post.authorId);
    }
  }

  function handleDelete() {
    deletePost(post.id);
    setConfirmDelete(false);
    setMenuOpen(false);
  }

  function handleShare() {
    const text = `${post.body}\n\n${author?.name ? `Shared by ${author.name} on AssignX Academy` : "AssignX Academy"}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  }

  return (
    <article
      className={cn(
        "card p-5 transition-shadow hover:shadow-md",
        post.pinned && "ring-1 ring-brand-300",
      )}
    >
      {/* Pinned label */}
      {post.pinned && (
        <span className="mb-3 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
          <Pin className="h-3 w-3" />
          Pinned
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar emoji={author?.avatar} name={author?.name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <UserNameButton
                userId={post.authorId}
                className="text-sm"
              />
              <RoleBadge role={role} />
              {/* Follow pill: next to the name so it reads as "follow this person" */}
              {!isSelf && (
                <button
                  onClick={handleFollow}
                  aria-label={
                    following
                      ? `Unfollow ${author?.name ?? "user"}`
                      : `Follow ${author?.name ?? "user"}`
                  }
                  aria-disabled={paused}
                  title={paused ? "Reactivate your account to interact" : undefined}
                  disabled={paused}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                    following
                      ? "border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "border-line bg-white text-ink-500 hover:bg-surface-2 hover:text-ink-900",
                    paused && "cursor-not-allowed opacity-50",
                  )}
                >
                  {following ? (
                    <UserCheck className="h-3 w-3" />
                  ) : (
                    <UserPlus className="h-3 w-3" />
                  )}
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
            <span className="text-xs text-ink-300">
              {relativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        {/* 3-dot menu */}
        {showMenu && (
          <div className="relative">
            <button
              onClick={() => {
                setMenuOpen((v) => !v);
                setConfirmDelete(false);
              }}
              aria-label="Post options"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-surface-2 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && !confirmDelete && (
              <div className="absolute right-0 top-9 z-20 min-w-[160px] rounded-xl border border-line bg-white py-1 shadow-lg">
                {canPin && (
                  <button
                    onClick={() => {
                      if (post.pinned) {
                        unpinPost(post.id);
                      } else {
                        pinPost(post.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-surface-2"
                  >
                    <Pin className="h-4 w-4 text-brand-500" />
                    {post.pinned ? "Unpin post" : "Pin post"}
                  </button>
                )}
                {canDel && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete post
                  </button>
                )}
              </div>
            )}

            {/* Inline delete confirmation */}
            {menuOpen && confirmDelete && (
              <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-line bg-white p-3 shadow-lg">
                <p className="mb-2 text-sm font-medium text-ink-900">
                  Delete this post?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false);
                      setMenuOpen(false);
                    }}
                    className="flex-1 rounded-lg bg-surface-2 py-1.5 text-xs font-semibold text-ink-700 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-3">
        <p className="text-[15px] leading-relaxed text-ink-700 whitespace-pre-wrap break-words">
          {bodyDisplay}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-sm font-semibold text-brand-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Media */}
      {post.mediaType === "link" && post.mediaPayload && isSafeUrl(post.mediaPayload) && (
        <a
          href={post.mediaPayload}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:border-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">{post.mediaPayload}</span>
        </a>
      )}

      {post.mediaType === "image" && (
        <div className="mt-3 flex aspect-video items-center justify-center gap-2 rounded-xl bg-surface-3 text-ink-300">
          <ImageIcon className="h-6 w-6" />
          <span className="text-sm font-medium">Image (coming soon)</span>
        </div>
      )}

      {post.mediaType === "video" && (
        <div className="mt-3 flex aspect-video items-center justify-center gap-2 rounded-xl bg-surface-3 text-ink-300">
          <Video className="h-6 w-6" />
          <span className="text-sm font-medium">Video (coming soon)</span>
        </div>
      )}

      {/* Engagement summary */}
      {(likes > 0 || comments > 0) && (
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
          {likes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3 w-3 fill-magenta text-magenta" />
              {likes} {likes === 1 ? "like" : "likes"}
            </span>
          )}
          {comments > 0 && (
            <span>
              {comments} {comments === 1 ? "comment" : "comments"}
            </span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-2">
        {/* Like */}
        <button
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike post" : "Like post"}
          aria-disabled={paused}
          title={paused ? "Reactivate your account to interact" : undefined}
          disabled={paused}
          className={cn(
            "min-h-[44px] flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
            liked
              ? "text-magenta hover:bg-pink-50"
              : "text-ink-500 hover:bg-surface-2 hover:text-ink-900",
            paused && "cursor-not-allowed opacity-50",
          )}
        >
          <Heart
            className={cn("h-4 w-4", liked && "fill-magenta text-magenta")}
          />
          {liked ? "Liked" : "Like"}
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-label={showComments ? "Hide comments" : "Show comments"}
          aria-expanded={showComments}
          aria-disabled={paused}
          title={paused ? "Reactivate your account to interact" : undefined}
          className={cn(
            "min-h-[44px] flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
            showComments
              ? "bg-brand-50 text-brand-500"
              : "text-ink-500 hover:bg-surface-2 hover:text-ink-900",
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>

        {/* Share (copies the post to the clipboard) */}
        <button
          onClick={handleShare}
          aria-label="Copy post to clipboard"
          className={cn(
            "min-h-[44px] flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
            copied
              ? "text-success"
              : "text-ink-500 hover:bg-surface-2 hover:text-ink-900",
          )}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Share"}
        </button>
      </div>

      {/* Comment thread (inline) */}
      {showComments && (
        <div className="mt-2">
          <CommentThread postId={post.id} />
        </div>
      )}
    </article>
  );
}
