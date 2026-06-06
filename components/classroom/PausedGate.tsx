"use client";

import { motion } from "framer-motion";
import { PauseCircle } from "lucide-react";

export function PausedGate() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden rounded-3xl border border-line bg-white"
      >
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3">
            <PauseCircle className="h-8 w-8 text-ink-500" />
          </span>
          <h1 className="text-2xl sm:text-3xl">Your access is paused</h1>
          <p className="max-w-md text-ink-500">
            Your partner account is currently on hold. Reach out to your AssignX
            admin to have your access restored.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
