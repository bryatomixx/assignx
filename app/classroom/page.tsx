"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Chip } from "@/components/ui/Badge";
import { COURSE_30DAY } from "@/lib/mock/modules";

function ComingSoonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
      aria-disabled="true"
      className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-surface-2/40 p-6 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-3 text-ink-300">
        <Plus className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold uppercase tracking-widest text-ink-300">
        Coming soon
      </span>
    </motion.div>
  );
}

export default function ClassroomPage() {
  const { currentUser, overallPct, ready } = useAcademy();

  if (!ready || !currentUser) {
    return <div className="p-8 text-ink-300">Loading classroom…</div>;
  }

  const course = COURSE_30DAY;
  const pct = overallPct();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-6"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
            Classroom
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl">
            Welcome back, {currentUser.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 max-w-xl text-ink-500">
            Build and sell AI agents the AssignX way. Start with the free 30 Days
            Challenge.
          </p>
        </div>

        {/* Overall course progress, top-right of the classroom screen. */}
        <div className="hidden shrink-0 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm sm:block">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-magenta" />
            Your progress
          </div>
          <div className="w-44">
            <ProgressBar pct={pct} showLabel />
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* The course */}
        <Link href={course.firstLessonHref} className="block h-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white"
          >
            <div
              className="relative flex h-32 items-center justify-center"
              style={{ backgroundImage: course.accent }}
            >
              <course.Icon
                className="h-12 w-12 text-white drop-shadow-sm"
                strokeWidth={1.75}
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 flex items-center gap-2">
                <Chip>Free</Chip>
                <span className="text-xs font-medium text-ink-300">
                  {course.moduleCount} modules · {course.lessonCount} lessons
                </span>
              </div>
              <h3 className="text-xl leading-snug">{course.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">
                {course.description}
              </p>
              <div className="mt-auto pt-5">
                <ProgressBar pct={pct} showLabel className="mb-3" />
                <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-transform group-hover:translate-x-0.5">
                  {pct > 0 ? "Continue" : "Start"} course
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Coming-soon placeholders */}
        {[0, 1, 2].map((i) => (
          <ComingSoonCard key={i} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
