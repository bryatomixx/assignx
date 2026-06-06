"use client";

import { motion } from "framer-motion";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { ModuleCard } from "@/components/classroom/ModuleCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function ClassroomPage() {
  const { modules, currentUser, overallPct, ready } = useAcademy();

  if (!ready || !currentUser) {
    return <div className="p-8 text-ink-300">Loading classroom…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Classroom
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl">
          Welcome back, {currentUser.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-2 max-w-xl text-ink-500">
          Build and sell AI agents the AssignX way. Start with the free 30 Days
          Challenge — partner modules unlock with full access.
        </p>

        <div className="mt-6 max-w-md rounded-2xl border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-900">Overall progress</span>
            <span className="text-ink-500">{overallPct()}% complete</span>
          </div>
          <ProgressBar pct={overallPct()} />
        </div>
      </motion.div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <ModuleCard key={m.id} module={m} index={i} />
        ))}
      </div>
    </div>
  );
}
