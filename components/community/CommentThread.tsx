"use client";

import { useState, useRef } from "react";
import { Pin, Send, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn, relativeTime } from "@/lib/utils";

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const {
    commentsFor,
    addComment,
    deleteComment,
    pinComment,
    unpinComment,
    canPinContent,
    canDeleteComment,
    roleOf,
  } = useBoard();
  const { currentUser, users, isPaused } = useAcademy();

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const paused = isPaused();
  const comments = commentsFor(postId);

  function handleSubmit() {
    if (!draft.trim() || paused || submitting) return;
    setSubmitting(true);
    addComment(postId, draft.trim());
    setDraft("");
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-line pt-3">
      {/* Comment list */}
      {comments.length > 0 && (
        <ul className="mb-3 flex flex-col gap-3">
          {comments.map((comment) => {
            const author = users.find((u) => u.id === comment.authorId);
            const role = roleOf(comment.authorId);
            const canPin = canPinContent();
            const canDel = canDeleteComment(comment.id);
            const isDeleting = pendingDelete === comment.id;

            return (
              <li
                key={comment.id}
                className={cn(
                  "group relative rounded-xl p-3 text-sm",
                  comment.pinned ? "bg-brand-50" : "bg-surface-2",
                )}
              >
                {comment.pinned && (
                  <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
                    <Pin className="h-3 w-3" />
                    Pinned comment
                  </span>
                )}

                <div className="flex items-start gap-2">
                  <Avatar emoji={author?.avatar ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-ink-900">
                        {author?.name ?? "Unknown"}
                      </span>
                      <RoleBadge role={role} />
                      <span className="text-[12px] text-ink-300">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 break-words text-ink-700">
                      {comment.body}
                    </p>
                  </div>

                  {/* Mod/admin actions (visible on hover) */}
                  {(canPin || canDel) && !isDeleting && (
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {canPin && (
                        <button
                          onClick={() =>
                            comment.pinned
                              ? unpinComment(comment.id)
                              : pinComment(comment.id)
                          }
                          aria-label={
                            comment.pinned ? "Unpin comment" : "Pin comment"
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-brand-50 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDel && (
                        <button
                          onClick={() => setPendingDelete(comment.id)}
                          aria-label="Delete comment"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-300 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline delete confirmation */}
                {isDeleting && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm">
                    <span className="flex-1 text-red-700">
                      Delete this comment?
                    </span>
                    <button
                      onClick={() => {
                        deleteComment(comment.id);
                        setPendingDelete(null);
                      }}
                      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setPendingDelete(null)}
                      className="rounded-md px-2.5 py-1 text-xs font-semibold text-ink-500 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add comment input */}
      <div className="flex items-center gap-2">
        {currentUser && <Avatar emoji={currentUser.avatar} size="sm" />}
        <div className="flex flex-1 items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 focus-within:border-brand-300 focus-within:ring-1 focus-within:ring-brand-300">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={paused}
            maxLength={500}
            placeholder={
              paused
                ? "Reactivate your account to interact"
                : "Add a comment..."
            }
            aria-label="Add a comment"
            className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-300 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={handleSubmit}
            disabled={!draft.trim() || paused}
            aria-label="Send comment"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-300 transition-colors hover:text-brand-500 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
