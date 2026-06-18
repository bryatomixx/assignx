import { cn } from "@/lib/utils";

/**
 * AssignX wordmark. Renders the brand logo image. `className` can override the
 * default height (e.g. a larger logo on the login card).
 */
export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assignx-logo.png"
      alt="AssignX"
      className={cn("h-16 w-auto select-none", className)}
      draggable={false}
    />
  );
}
