import { User } from "lucide-react";
import { cn } from "@/lib/utils";

// Derives 1-2 uppercase initials from a name. "Noah Nega" -> "NN", "test" -> "TE".
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  emoji,
  name,
  size = "md",
  className,
}: {
  /** Emoji avatar. When empty, the component falls back to initials or an icon. */
  emoji?: string;
  /** Used to render initials when there is no emoji. */
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" }[size];
  const emojiText = { sm: "text-base", md: "text-xl", lg: "text-3xl" }[size];
  const initText = { sm: "text-[11px]", md: "text-sm", lg: "text-lg" }[size];
  const iconSize = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" }[size];

  const hasEmoji = !!emoji && emoji.trim().length > 0 && emoji !== "?";
  const initials = !hasEmoji && name ? initialsOf(name) : "";

  // 1) Emoji avatar
  if (hasEmoji) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-surface-3 ring-1 ring-line",
          dims,
          emojiText,
          className,
        )}
      >
        {emoji}
      </span>
    );
  }

  // 2) Initials fallback (brand gradient)
  if (initials) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center rounded-full gradient-brand font-semibold text-white ring-1 ring-line",
          dims,
          initText,
          className,
        )}
      >
        {initials}
      </span>
    );
  }

  // 3) Generic user icon fallback
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-surface-3 text-ink-400 ring-1 ring-line",
        dims,
        className,
      )}
    >
      <User className={iconSize} />
    </span>
  );
}
