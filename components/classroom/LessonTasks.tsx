"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";
import type { ChecklistTask } from "@/lib/mock/tasks";

/** A single checkable task row. Completion is shared via the homework store. */
function TaskRow({
  task,
  showLink,
}: {
  task: ChecklistTask;
  showLink?: boolean;
}) {
  const { isHomeworkDone, toggleHomework } = useAcademy();
  const done = isHomeworkDone(task.id);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark "${task.label}" not done` : `Mark "${task.label}" done`}
        onClick={() => toggleHomework(task.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
          done
            ? "border-brand-500 bg-brand-500 text-white"
            : "border-line bg-white hover:border-brand-300",
        )}
      >
        {done && <Check className="h-3.5 w-3.5" />}
      </button>
      <span
        className={cn(
          "flex-1 text-sm",
          done ? "text-ink-400 line-through" : "text-ink-700",
        )}
      >
        {task.label}
      </span>
      {showLink && (
        <Link
          href={`/classroom/${task.sourceModuleSlug}/${task.sourceLessonId}`}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
        >
          Go to lesson <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/** Full checklist, shown on the checklist lesson. */
export function LessonChecklist({ tasks }: { tasks: ChecklistTask[] }) {
  const { isHomeworkDone } = useAcademy();
  const doneCount = tasks.filter((t) => isHomeworkDone(t.id)).length;

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Checklist
        </h3>
        <span className="text-xs font-semibold text-ink-400">
          {doneCount}/{tasks.length} done
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} showLink />
        ))}
      </div>
    </div>
  );
}

/** The task(s) sourced from a lesson, shown as an extra check on that lesson. */
export function LessonChecklistItem({
  tasks,
  checklistTitle,
  checklistHref,
}: {
  tasks: ChecklistTask[];
  checklistTitle: string;
  checklistHref: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {checklistTitle} task
        </span>
        <Link
          href={checklistHref}
          className="text-xs font-semibold text-brand-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
        >
          View checklist
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
