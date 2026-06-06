"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProgressBar({
  pct,
  className,
  showLabel = false,
}: {
  pct: number;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="h-full rounded-full gradient-brand"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-sm font-semibold text-ink-700">
          {pct}%
        </span>
      )}
    </div>
  );
}
