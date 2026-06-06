"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
} from "lucide-react";
import { getModule } from "@/lib/mock/modules";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Chip } from "@/components/ui/Badge";
import { LockedGate } from "@/components/classroom/LockedGate";
import { cn } from "@/lib/utils";

export default function ModulePage() {
  const { module: slug } = useParams<{ module: string }>();
  const { ready, canAccess, isComplete, moduleProgress } = useAcademy();
  const module = getModule(slug);

  if (!module) {
    return <div className="p-8 text-ink-300">Module not found.</div>;
  }
  if (!ready) return <div className="p-8 text-ink-300">Loading…</div>;
  if (!canAccess(module)) return <LockedGate module={module} />;

  const prog = moduleProgress(module.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href="/classroom"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Classroom
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 overflow-hidden rounded-3xl border border-line bg-white"
      >
        <div
          className="flex items-center gap-4 p-6"
          style={{ backgroundImage: module.accent }}
        >
          <span className="text-5xl">{module.coverEmoji}</span>
          <div className="text-white">
            <h1 className="text-2xl text-white sm:text-3xl">{module.title}</h1>
            <p className="mt-1 text-sm text-white/85">
              {module.lessons.length} lessons · {prog.completed} completed
            </p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-ink-500">{module.description}</p>
          <div className="mt-4 flex items-center gap-3">
            <Chip>{module.access === "free" ? "Free" : "Premium"}</Chip>
            <ProgressBar pct={prog.pct} showLabel className="flex-1" />
          </div>
        </div>
      </motion.div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink-900">Lessons</h2>
      <div className="flex flex-col gap-2">
        {module.lessons.map((lesson, i) => {
          const done = isComplete(lesson.id);
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.4) }}
            >
              <Link
                href={`/classroom/${module.slug}/${lesson.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3.5 transition-colors hover:border-brand-300"
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
                ) : (
                  <Circle className="h-6 w-6 shrink-0 text-ink-300 group-hover:text-brand-300" />
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate font-medium",
                      done ? "text-ink-500" : "text-ink-900",
                    )}
                  >
                    {lesson.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-300">
                    <Clock className="h-3 w-3" /> {lesson.durationMin} min
                  </div>
                </div>
                <PlayCircle className="h-5 w-5 shrink-0 text-ink-300 transition-colors group-hover:text-brand-500" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
