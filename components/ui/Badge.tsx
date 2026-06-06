import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/types";

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        tier === "paid"
          ? "gradient-brand text-white"
          : "bg-surface-3 text-ink-500",
      )}
    >
      {tier === "paid" ? "★ Paid" : "Free"}
    </span>
  );
}

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
