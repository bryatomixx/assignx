"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Clock,
  Download,
} from "lucide-react";
import { hasHomework, getModule, lessonUsesChapters } from "@/lib/mock/modules";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { Button } from "@/components/ui/Button";
import { LessonSections } from "@/components/classroom/LessonSections";
import { LockedGate } from "@/components/classroom/LockedGate";
import { LessonContent } from "@/components/classroom/LessonContent";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const { module: slug, lesson: lessonId } = useParams<{
    module: string;
    lesson: string;
  }>();
  const {
    ready,
    canAccess,
    isComplete,
    toggleComplete,
    isHomeworkDone,
    toggleHomework,
  } = useAcademy();

  const module = getModule(slug);
  if (!module) return <div className="p-8 text-ink-300">Not found.</div>;
  if (!ready) return <div className="p-8 text-ink-300">Loading...</div>;
  if (!canAccess(module)) return <LockedGate module={module} />;

  const index = module.lessons.findIndex((l) => l.id === lessonId);
  const lesson = module.lessons[index];
  if (!lesson) return <div className="p-8 text-ink-300">Lesson not found.</div>;

  const prev = index > 0 ? module.lessons[index - 1] : null;
  const next =
    index < module.lessons.length - 1 ? module.lessons[index + 1] : null;
  const done = isComplete(lesson.id);
  const lessonHasHomework = hasHomework(lesson);
  const hwDone = isHomeworkDone(lesson.id);
  // Chaptered lessons carry their task per chapter, so the single bottom
  // Homework block is hidden for them.
  const usesChapters = lessonUsesChapters(lesson);

  // Sections that are NOT the cover section (e.g. Homework)
  const otherSections = lesson.sections?.filter((s) => /homework/i.test(s.heading)) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href={`/classroom/${module.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> {module.title}
      </Link>

      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4"
      >
        {/* Lesson header */}
        <div className="flex items-center gap-1.5 text-xs text-ink-300">
          <Clock className="h-3.5 w-3.5" /> {lesson.durationMin} min · Lesson{" "}
          {index + 1} of {module.lessons.length}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl">{lesson.title}</h1>
        {lesson.subtitle && (
          <p className="mt-1 text-sm font-medium text-brand-500">
            {lesson.subtitle}
          </p>
        )}
        <div className="mt-4 mb-6 whitespace-pre-line leading-relaxed text-ink-700">
          {lesson.content}
        </div>

        {/*
          LessonContent owns the per-lesson UI state. key={lesson.id} ensures it
          unmounts and remounts on every lesson navigation, so state resets
          automatically. It renders the two-pane classroom: chapter rail (left)
          + the selected chapter's video, description and task (main pane).
        */}
        <LessonContent
          key={lesson.id}
          lesson={lesson}
          module={module}
          next={next}
          moduleSlug={module.slug}
        />

        {/* Legacy bottom Homework block -- only for lessons without chapters */}
        {!usesChapters && otherSections.length > 0 && (
          <div className="mt-6">
            <LessonSections sections={otherSections} />
          </div>
        )}

        {/* Resources */}
        {lesson.resources.length > 0 && (
          <div className="mt-7">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Resources
            </h3>
            <div className="flex flex-col gap-2">
              {lesson.resources.map((r) => (
                <a
                  key={r.id}
                  href={r.href}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300"
                >
                  <Download className="h-4 w-4 text-brand-500" />
                  {r.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Mark complete */}
        <div className="mt-8">
          <Button
            variant={done ? "secondary" : "primary"}
            size="lg"
            onClick={() => toggleComplete(lesson.id)}
            className="w-full"
          >
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.span
                  key="done"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-5 w-5 text-success" /> Completed (click to undo)
                </motion.span>
              ) : (
                <motion.span
                  key="todo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  Mark as complete
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          {!usesChapters && lessonHasHomework && (
            <button
              onClick={() => toggleHomework(lesson.id)}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2 rounded-[9px] border px-5 py-3 text-[15px] font-medium transition-colors",
                hwDone
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-line bg-white text-ink-700 hover:border-brand-300",
              )}
            >
              <ClipboardCheck className="h-5 w-5" />
              {hwDone ? "Homework done (click to undo)" : "Mark homework as done"}
            </button>
          )}
        </div>

        {/* Prev / next lesson navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {prev ? (
            <Link
              href={`/classroom/${module.slug}/${prev.id}`}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/classroom/${module.slug}/${next.id}`}
              className={cn(
                "flex items-center gap-1.5 text-sm font-semibold text-brand-500",
              )}
            >
              Next lesson <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/classroom/${module.slug}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-500"
            >
              Back to module <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
