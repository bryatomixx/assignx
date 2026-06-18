"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/community/RoleBadge";
import { BADGE_ICON_MAP } from "@/components/community/TopContributors";
import { ALL_BADGES } from "@/lib/community/gamification";
import { useBoard } from "@/lib/store/BoardProvider";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { isOwner } from "@/lib/community/owner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// UserPreviewCard modal
// ---------------------------------------------------------------------------

interface UserPreviewCardProps {
  userId: string;
  onClose: () => void;
}

export function UserPreviewCard({ userId, onClose }: UserPreviewCardProps) {
  const { follow, unfollow, isFollowing, gamificationFor, roleOf } = useBoard();
  const { currentUser, users, isPaused } = useAcademy();

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  // Portal requires the DOM to be available.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Focus the close button when the card opens.
  useEffect(() => {
    if (mounted) {
      closeButtonRef.current?.focus();
    }
  }, [mounted]);

  // Close on Escape key.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const member = users.find((u) => u.id === userId);
  const gami = gamificationFor(userId);
  const role = roleOf(userId);
  const following = isFollowing(userId);
  const isSelf = currentUser?.id === userId;
  const paused = isPaused();
  const earnedBadgeIds = new Set(gami.badges.map((b) => b.id));

  function handleFollow() {
    if (paused || isSelf) return;
    if (following) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  }

  // Click outside overlay to close.
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const card = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
        onClick={handleOverlayClick}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden="true"
        />

        {/* Card */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={member ? `${member.name}'s profile` : "User profile"}
          className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close profile preview"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-surface-2 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-5">
            {/* Header: avatar + name + badges row */}
            <div className="flex items-start gap-3">
              <Avatar emoji={member?.avatar} name={member?.name} size="lg" />
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-base font-semibold text-ink-900 leading-tight">
                    {member?.name ?? "Unknown"}
                  </span>
                  <RoleBadge role={role} />
                  {/* Level chip */}
                  <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                    {gami.levelName}
                  </span>
                </div>

                {/* Points */}
                <p className="mt-0.5 text-xs text-ink-400">
                  {gami.points} pts
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              {member?.bio ? (
                <p className="text-sm leading-relaxed text-ink-700">
                  {member.bio}
                </p>
              ) : (
                <p className="text-sm text-ink-300 italic">No bio yet.</p>
              )}
            </div>

            {/* Badges */}
            {ALL_BADGES.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Badges
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_BADGES.map((badge) => {
                    const earned = earnedBadgeIds.has(badge.id);
                    const IconComponent = BADGE_ICON_MAP[badge.icon];
                    return (
                      <div
                        key={badge.id}
                        title={badge.description}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          earned
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-line bg-surface-2 text-ink-300 opacity-50",
                        )}
                        aria-label={
                          earned
                            ? `${badge.label} (earned)`
                            : `${badge.label} (not earned)`
                        }
                      >
                        {IconComponent && (
                          <IconComponent
                            className={cn(
                              "h-3 w-3 shrink-0",
                              earned ? "text-amber-600" : "text-ink-400",
                            )}
                            aria-hidden="true"
                          />
                        )}
                        {badge.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions row */}
            <div className="mt-5 flex items-center justify-between gap-3">
              {/* The owner (Noah) is not browsable: no full-profile link. */}
              {isOwner(userId) ? (
                <span />
              ) : (
                <Link
                  href={`/community/members/${userId}`}
                  onClick={onClose}
                  className="text-xs font-medium text-brand-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
                >
                  View full profile
                </Link>
              )}

              {!isSelf && (
                <button
                  onClick={handleFollow}
                  disabled={paused}
                  aria-label={
                    following
                      ? `Unfollow ${member?.name ?? "user"}`
                      : `Follow ${member?.name ?? "user"}`
                  }
                  aria-disabled={paused}
                  title={paused ? "Reactivate your account to interact" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                    following
                      ? "border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "border-line bg-white text-ink-500 hover:bg-surface-2 hover:text-ink-900",
                    paused && "cursor-not-allowed opacity-50",
                  )}
                >
                  {following ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(card, document.body);
}

// ---------------------------------------------------------------------------
// UserNameButton - renders the user's name as a button that opens the card
// ---------------------------------------------------------------------------

interface UserNameButtonProps {
  userId: string;
  className?: string;
}

export function UserNameButton({ userId, className }: UserNameButtonProps) {
  const { users } = useAcademy();
  const [open, setOpen] = useState(false);

  const user = users.find((u) => u.id === userId);
  const name = user?.name ?? "Unknown";

  // The owner (Noah) is not browsable: render the name as plain text, with no
  // preview card and no profile navigation.
  if (isOwner(userId)) {
    return (
      <span className={cn("font-semibold text-ink-900", className)}>{name}</span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "text-left font-semibold text-ink-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded",
          className,
        )}
        aria-label={`View ${name}'s profile`}
      >
        {name}
      </button>

      {open && (
        <UserPreviewCard
          userId={userId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
