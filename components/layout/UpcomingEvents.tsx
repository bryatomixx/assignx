"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, ChevronUp, ExternalLink } from "lucide-react";
import { fetchEvents } from "@/lib/events/api";
import {
  upcomingEvents,
  formatDateShort,
  formatTime12h,
} from "@/lib/events/occurrence";
import type { AcademyEvent } from "@/lib/events/types";
import { cn } from "@/lib/utils";

/**
 * Sidebar "Upcoming Events" widget. Loads events from the API, computes each
 * one's next occurrence, keeps only future ones (soonest first), and expands
 * UPWARD to reveal them. Events with a link are clickable.
 */
export function UpcomingEvents() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<AcademyEvent[]>([]);

  useEffect(() => {
    let active = true;
    void fetchEvents().then((evs) => {
      if (active) setEvents(evs);
    });
    return () => {
      active = false;
    };
  }, []);

  const upcoming = upcomingEvents(events, new Date());

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
            {upcoming.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-400">
                No upcoming events yet.
              </p>
            ) : (
              <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto overscroll-contain p-1">
                {upcoming.map(({ event, next }) => {
                  const meta = `${formatDateShort(next)} · ${formatTime12h(event.startTime)} ${event.timezone}`;
                  const body = (
                    <>
                      <p className="text-[13px] font-semibold leading-snug text-ink-900">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">{meta}</p>
                    </>
                  );
                  return (
                    <li key={event.id}>
                      {event.link ? (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                        >
                          <span className="min-w-0">{body}</span>
                          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-ink-300 transition-colors group-hover:text-brand-500" />
                        </a>
                      ) : (
                        <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                          {body}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
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
            {upcoming.length}
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
