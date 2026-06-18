"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock, Download, FileText } from "lucide-react";
import { getModule, COURSE_30DAY } from "@/lib/mock/modules";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { Button } from "@/components/ui/Button";
import { LockedGate } from "@/components/classroom/LockedGate";
import { ModuleNav } from "@/components/classroom/ModuleNav";
import { LessonMedia } from "@/components/classroom/LessonMedia";
import { RichContent } from "@/components/classroom/RichContent";

// Entrance animation. The container fades only (no transform) so it never moves
// the fixed-position player's placeholder; each block slides up in a stagger.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LessonPage() {
  const { module: slug, lesson: lessonId } = useParams<{
    module: string;
    lesson: string;
  }>();
  const { ready, canAccess, isComplete, toggleComplete } = useAcademy();

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
  const isText = lesson.kind === "text";
  const resources = lesson.resources ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: course navigation (modules -> lessons accordion) */}
        <motion.aside
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <ModuleNav
            currentModuleSlug={module.slug}
            currentLessonId={lesson.id}
          />
        </motion.aside>

        {/* Right: the current lesson */}
        <main className="min-w-0">
          <Link
            href="/classroom"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" /> {COURSE_30DAY.title}
          </Link>

          <motion.div
            key={lesson.id}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-4"
          >
            {/* Title at the top of main, above the player. */}
            <motion.div variants={itemVariants}>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-300">
                <Clock className="h-3.5 w-3.5" /> {lesson.durationMin} min · Lesson{" "}
                {index + 1} of {module.lessons.length}
                {isText && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-ink-400">
                      <FileText className="h-3 w-3" /> Text lesson
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl">{lesson.title}</h1>
            </motion.div>

            {/* Optional banner image (e.g. a sales-deck preview), shown above the body. */}
            {lesson.image && (
              <motion.div
                variants={itemVariants}
                className="mt-5 overflow-hidden rounded-2xl border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lesson.image}
                  alt={lesson.imageAlt ?? lesson.title}
                  className="block h-auto w-full"
                />
              </motion.div>
            )}

            {/* Player (plain wrapper -- transform-free so the fixed player stays anchored) */}
            {!isText && (
              <div className="mt-5">
                <LessonMedia
                  key={lesson.id}
                  lesson={lesson}
                  module={module}
                  next={next}
                  moduleSlug={module.slug}
                />
              </div>
            )}

            {/* Description / content */}
            {lesson.content && (
              <motion.div
                variants={itemVariants}
                className="mt-5 whitespace-pre-line leading-relaxed text-ink-700"
              >
                <RichContent text={lesson.content} />
              </motion.div>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <motion.div variants={itemVariants} className="mt-7">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                  Resources
                </h3>
                <div className="flex flex-col gap-2">
                  {resources.map((r) => (
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
              </motion.div>
            )}

            {/* Mark complete */}
            <motion.div variants={itemVariants} className="mt-8">
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
                      <Check className="h-5 w-5 text-success" /> Completed (click to
                      undo)
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
            </motion.div>

            {/* Prev / next lesson navigation */}
            <motion.div
              variants={itemVariants}
              className="mt-6 flex items-center justify-between gap-3"
            >
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
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-500"
                >
                  Next lesson <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/classroom"
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-500"
                >
                  Back to course <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
