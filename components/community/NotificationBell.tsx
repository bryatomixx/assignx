"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn, relativeTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

// Build the human-readable text for each notification type.
function notifText(
  notif: AppNotification,
  actorName: string,
): string {
  switch (notif.type) {
    case "like":
      return `${actorName} liked your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "follow":
      return `${actorName} started following you`;
    case "post_approved":
      return `Your post was approved by ${actorName}`;
    case "post_rejected":
      return "Your post was not approved";
    case "post_pending":
      return `${actorName} submitted a post for review`;
    default:
      return "New notification";
  }
}

export function NotificationBell() {
  const { notificationsFor, unreadCount, markNotificationRead, markAllNotificationsRead } =
    useBoard();
  const { currentUser, users } = useAcademy();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!currentUser) return null;

  const unread = unreadCount();
  const notifications = notificationsFor();

  function handleItemClick(notif: AppNotification) {
    markNotificationRead(notif.id);
    setOpen(false);

    if (notif.type === "follow") {
      router.push(`/community/members/${notif.actorId}`);
    } else {
      // post-related types
      router.push("/community");
    }
  }

  // Display badge number, capped at "9+"
  const badgeLabel = unread > 9 ? "9+" : String(unread);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : "Notifications"
        }
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge (magenta) */}
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-magenta px-1 text-[10px] font-bold leading-none text-white"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink-900">
              Notifications
            </span>
            <button
              onClick={() => markAllNotificationsRead()}
              disabled={unread === 0}
              className={cn(
                "text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded",
                unread > 0
                  ? "text-brand-500 hover:text-brand-700"
                  : "cursor-not-allowed text-ink-300",
              )}
            >
              Mark all read
            </button>
          </div>

          {/* Notification list */}
          <ul
            className="max-h-[360px] overflow-y-auto"
            aria-label="Notification items"
          >
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-ink-300">
                No notifications yet.
              </li>
            ) : (
              notifications.map((notif) => {
                const actor = users.find((u) => u.id === notif.actorId);
                const actorName = actor?.name ?? "Someone";
                const text = notifText(notif, actorName);

                return (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleItemClick(notif)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300",
                        !notif.read && "bg-brand-50",
                      )}
                    >
                      {/* Unread dot */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1 h-2 w-2 shrink-0 rounded-full",
                          !notif.read ? "bg-brand-500" : "bg-transparent",
                        )}
                      />

                      {/* Actor avatar */}
                      <Avatar
                        emoji={actor?.avatar ?? "?"}
                        size="sm"
                        className="shrink-0"
                      />

                      {/* Text + timestamp */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-ink-700">
                          {text}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-300">
                          {relativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
