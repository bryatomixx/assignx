"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, ChevronUp } from "lucide-react";
import { UPCOMING_EVENTS } from "@/lib/mock/events";
import { cn } from "@/lib/utils";

/**
 * Sidebar "Upcoming Events" widget. Sits at the bottom of the sidebar and, when
 * clicked, expands UPWARD to reveal the event list (date, time, title). The list
 * is rendered above the toggle button so it grows up into the sidebar.
 */
export function UpcomingEvents() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-surface-2 p-2">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="events"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto overscroll-contain p-1">
              {UPCOMING_EVENTS.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-xl bg-white px-3 py-2 shadow-sm"
                >
                  <p className="text-[13px] font-semibold leading-snug text-ink-900">
                    {ev.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {ev.date} · {ev.time}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        <CalendarClock className="h-3.5 w-3.5 text-magenta" />
        Upcoming Events
        <span className="ml-auto flex items-center gap-1.5">
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-100 px-1 text-[10px] font-bold text-brand-700">
            {UPCOMING_EVENTS.length}
          </span>
          <ChevronUp
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
    </div>
  );
}
