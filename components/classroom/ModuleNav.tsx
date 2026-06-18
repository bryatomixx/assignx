"use client";

/**
 * ModuleNav
 *
 * The left course-navigation rail. Lists every module (Orientation, Week 1-4)
 * as an accordion dropdown that expands to its lessons. Only one module is open
 * at a time (opening one collapses the rest); the module containing the current
 * lesson is open by default. Expanding/collapsing uses a height + swipe ("barrida")
 * animation, with the lesson rows sliding in on open. Clicking a lesson navigates.
 *
 * Each module shows its own gradient icon badge and a thin progress bar so the
 * rail reads as a real curriculum rather than a flat list.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, FileText, Lock, Play } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

export interface ModuleNavProps {
  currentModuleSlug: string;
  currentLessonId: string;
}

export function ModuleNav({
  currentModuleSlug,
  currentLessonId,
}: ModuleNavProps) {
  const { modules, isComplete, canAccess } = useAcademy();
  const reduced = useReducedMotion() ?? false;

  const initialOpen =
    modules.find((m) => m.slug === currentModuleSlug)?.id ??
    modules[0]?.id ??
    null;
  const [openId, setOpenId] = useState<string | null>(initialOpen);

  return (
    <nav
      aria-label="Course"
      className="overflow-hidden rounded-2xl border border-line bg-white p-2"
    >
      <ul className="flex flex-col gap-1">
        {modules.map((m) => {
          const open = openId === m.id;
          const locked = !canAccess(m);
          const doneCount = m.lessons.filter((l) => isComplete(l.id)).length;
          const pct = m.lessons.length
            ? Math.round((doneCount / m.lessons.length) * 100)
            : 0;

          return (
            <li key={m.id}>
              {/* Module header (accordion toggle) */}
              <button
                type="button"
                onClick={() => setOpenId(open ? null : m.id)}
                aria-expanded={open}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500",
                  open ? "bg-brand-50" : "hover:bg-surface-2",
                )}
              >
                {/* Gradient icon badge */}
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundImage: m.accent }}
                >
                  <m.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold leading-tight",
                      open ? "text-brand-600" : "text-ink-900",
                    )}
                  >
                    {m.title}
                  </p>
                  {/* Per-module progress */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <span
                        className="block h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%`, backgroundImage: m.accent }}
                      />
                    </span>
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-ink-300">
                      {locked ? "" : `${doneCount}/${m.lessons.length}`}
                    </span>
                  </div>
                </div>

                {locked ? (
                  <Lock className="h-4 w-4 shrink-0 text-ink-300" />
                ) : (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300",
                      open ? "rotate-0" : "-rotate-90",
                    )}
                  />
                )}
              </button>

              {/* Lessons (animated open/close) */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="panel"
                    initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={
                      reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }
                    }
                    exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ul className="ml-[26px] flex flex-col gap-0.5 border-l border-line py-1 pl-2 pr-1">
                      {m.lessons.map((l, i) => {
                        const done = isComplete(l.id);
                        const active =
                          m.slug === currentModuleSlug &&
                          l.id === currentLessonId;
                        const isTextLesson = l.kind === "text";

                        return (
                          <motion.li
                            key={l.id}
                            initial={reduced ? false : { x: -12, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{
                              duration: 0.25,
                              delay: reduced ? 0 : Math.min(i * 0.03, 0.3),
                              ease: "easeOut",
                            }}
                          >
                            <Link
                              href={
                                locked
                                  ? `/classroom/${m.slug}`
                                  : `/classroom/${m.slug}/${l.id}`
                              }
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                                active
                                  ? "bg-gradient-to-r from-brand-50 to-transparent font-semibold text-brand-600"
                                  : "text-ink-700 hover:bg-surface-2",
                              )}
                            >
                              {/* Status dot/icon */}
                              <span
                                className={cn(
                                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                                  done
                                    ? "bg-success text-white"
                                    : active
                                      ? "bg-brand-500 text-white"
                                      : "border border-line text-ink-300",
                                )}
                              >
                                {done ? (
                                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                ) : isTextLesson ? (
                                  <FileText className="h-2.5 w-2.5" />
                                ) : (
                                  <Play
                                    className="h-2 w-2"
                                    fill="currentColor"
                                    strokeWidth={0}
                                  />
                                )}
                              </span>
                              <span className="flex-1 leading-snug">
                                {l.title}
                              </span>
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
