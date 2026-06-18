/**
 * Checklist tasks.
 *
 * A checklist lesson (e.g. "Week 1 checklist") groups a set of action items.
 * Each task ALSO surfaces on its source lesson as an extra checkbox, so a member
 * can tick it off either from the lesson or from the checklist. Completion is a
 * single shared state, persisted via the homework store keyed by the task id
 * (the homework table's lesson_id FK was dropped in migration 0003, so arbitrary
 * task ids are valid keys -- no migration needed).
 */

export interface ChecklistTask {
  /** Unique id, used as the (shared) completion key. */
  id: string;
  label: string;
  /** The lesson this task also appears on. */
  sourceModuleSlug: string;
  sourceLessonId: string;
}

export interface Checklist {
  /** The lesson that displays the full checklist. */
  moduleSlug: string;
  lessonId: string;
  tasks: ChecklistTask[];
}

export const CHECKLISTS: Checklist[] = [
  {
    moduleSlug: "week-1-getting-started",
    lessonId: "week-1-assignment",
    tasks: [
      {
        id: "task-w1-stripe",
        label: "Connect Stripe",
        sourceModuleSlug: "week-1-getting-started",
        sourceLessonId: "stripe-setup-walkthrough",
      },
      {
        id: "task-w1-twilio",
        label: "Connect Twilio",
        sourceModuleSlug: "week-1-getting-started",
        sourceLessonId: "twilio-integration",
      },
      {
        id: "task-w1-niche",
        label: "Pick your niche",
        sourceModuleSlug: "week-1-getting-started",
        sourceLessonId: "choose-perfect-niche",
      },
      {
        id: "task-w1-branding",
        label: "Lock your branding (name, colors, voice)",
        sourceModuleSlug: "week-1-getting-started",
        sourceLessonId: "name-brand-agency",
      },
    ],
  },
];

/** The checklist a lesson displays in full (if it is a checklist lesson). */
export function getChecklist(
  moduleSlug: string,
  lessonId: string,
): Checklist | undefined {
  return CHECKLISTS.find(
    (c) => c.moduleSlug === moduleSlug && c.lessonId === lessonId,
  );
}

/** Tasks whose SOURCE is this lesson (shown as an extra checkbox on it). */
export function tasksForSourceLesson(
  moduleSlug: string,
  lessonId: string,
): { task: ChecklistTask; checklist: Checklist }[] {
  const out: { task: ChecklistTask; checklist: Checklist }[] = [];
  for (const checklist of CHECKLISTS) {
    for (const task of checklist.tasks) {
      if (
        task.sourceModuleSlug === moduleSlug &&
        task.sourceLessonId === lessonId
      ) {
        out.push({ task, checklist });
      }
    }
  }
  return out;
}
