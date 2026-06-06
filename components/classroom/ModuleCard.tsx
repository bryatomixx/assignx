"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import type { Module } from "@/lib/types";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Chip } from "@/components/ui/Badge";

export function ModuleCard({ module, index }: { module: Module; index: number }) {
  const { canAccess, moduleProgress } = useAcademy();
  const locked = !canAccess(module);
  const prog = moduleProgress(module.id);
  const done = prog.pct === 100;

  return (
    <Link href={`/classroom/${module.slug}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
        whileHover={{ y: -4 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white"
      >
        {/* Cover */}
        <div
          className="relative flex h-32 items-center justify-center"
          style={{ backgroundImage: module.accent }}
        >
          <module.Icon className="h-12 w-12 text-white drop-shadow-sm" strokeWidth={1.75} />
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
              <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-ink-900">
                <Lock className="h-4 w-4 text-brand-500" /> Locked
              </span>
            </div>
          )}
          {done && !locked && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Done
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <Chip>{module.access === "free" ? "Free" : "Partner"}</Chip>
            <span className="text-xs font-medium text-ink-300">
              {module.lessons.length} lessons
            </span>
          </div>
          <h3 className="text-xl leading-snug">{module.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">
            {module.description}
          </p>

          <div className="mt-auto pt-5">
            {locked ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-500">
                <Lock className="h-4 w-4" /> Partner-only
              </span>
            ) : (
              <>
                <ProgressBar pct={prog.pct} showLabel className="mb-3" />
                <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-transform group-hover:translate-x-0.5">
                  {prog.completed > 0 ? "Continue" : "Start"} course
                  <ArrowRight className="h-4 w-4" />
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
