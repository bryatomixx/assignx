import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-display text-[22px] font-semibold tracking-[-0.04em] text-ink-900",
        className,
      )}
    >
      assign
      <span className="text-gradient-brand font-bold">X</span>
      <span className="text-ink-500">.ai</span>
    </span>
  );
}
