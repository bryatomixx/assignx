import { cn } from "@/lib/utils";

export function Avatar({
  emoji,
  size = "md",
  className,
}: {
  emoji: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-xl",
    lg: "h-14 w-14 text-3xl",
  }[size];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-surface-3 ring-1 ring-line",
        dims,
        className,
      )}
    >
      {emoji}
    </span>
  );
}
