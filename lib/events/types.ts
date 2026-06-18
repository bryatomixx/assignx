export type Recurrence = "once" | "weekly" | "monthly";

export interface AcademyEvent {
  id: string;
  title: string;
  link: string | null;
  timezone: string;
  /** "HH:MM" 24h. */
  startTime: string;
  recurrence: Recurrence;
  /** "YYYY-MM-DD", for recurrence = 'once'. */
  eventDate: string | null;
  /** 0 (Sun) - 6 (Sat), for recurrence = 'weekly'. */
  dayOfWeek: number | null;
  /** 1 - 31, for recurrence = 'monthly'. */
  dayOfMonth: number | null;
}

/** Draft shape for create/update forms (no id). */
export interface EventInput {
  title: string;
  link: string | null;
  timezone: string;
  startTime: string;
  recurrence: Recurrence;
  eventDate?: string | null;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
}

export const DAYS_OF_WEEK: { value: number; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

/** Timezone labels offered in the editor (display-only, no conversion). */
export const TIMEZONES = ["EST", "CST", "MST", "PST", "GMT", "CET"] as const;
