"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Button } from "@/components/ui/Button";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/events/api";
import {
  nextOccurrence,
  formatDateShort,
  formatTime12h,
} from "@/lib/events/occurrence";
import {
  DAYS_OF_WEEK,
  TIMEZONES,
  type AcademyEvent,
  type EventInput,
  type Recurrence,
} from "@/lib/events/types";
import { cn } from "@/lib/utils";

interface FormState {
  title: string;
  link: string;
  timezone: string;
  startTime: string;
  recurrence: Recurrence;
  eventDate: string;
  dayOfWeek: number;
  dayOfMonth: number;
}

const emptyForm: FormState = {
  title: "",
  link: "",
  timezone: "EST",
  startTime: "12:00",
  recurrence: "once",
  eventDate: "",
  dayOfWeek: 1,
  dayOfMonth: 1,
};

function formFromEvent(ev: AcademyEvent): FormState {
  return {
    title: ev.title,
    link: ev.link ?? "",
    timezone: ev.timezone,
    startTime: ev.startTime,
    recurrence: ev.recurrence,
    eventDate: ev.eventDate ?? "",
    dayOfWeek: ev.dayOfWeek ?? 1,
    dayOfMonth: ev.dayOfMonth ?? 1,
  };
}

function inputFromForm(f: FormState): EventInput {
  return {
    title: f.title.trim(),
    link: f.link.trim() || null,
    timezone: f.timezone,
    startTime: f.startTime,
    recurrence: f.recurrence,
    eventDate: f.recurrence === "once" ? f.eventDate : null,
    dayOfWeek: f.recurrence === "weekly" ? f.dayOfWeek : null,
    dayOfMonth: f.recurrence === "monthly" ? f.dayOfMonth : null,
  };
}

/** Human summary of an event's schedule for the list. */
function scheduleSummary(ev: AcademyEvent): string {
  const time = `${formatTime12h(ev.startTime)} ${ev.timezone}`;
  if (ev.recurrence === "weekly") {
    const day = DAYS_OF_WEEK.find((d) => d.value === ev.dayOfWeek)?.label ?? "";
    return `Weekly · ${day}s · ${time}`;
  }
  if (ev.recurrence === "monthly") {
    return `Monthly · day ${ev.dayOfMonth} · ${time}`;
  }
  const date = ev.eventDate
    ? formatDateShort(new Date(`${ev.eventDate}T00:00:00`))
    : "";
  return `One-time · ${date} · ${time}`;
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink-700 outline-none transition-colors focus:border-brand-300 focus:ring-1 focus:ring-brand-300";

function EventsAdminContent() {
  const [events, setEvents] = useState<AcademyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    const evs = await fetchEvents();
    setEvents(evs);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function startEdit(ev: AcademyEvent) {
    setEditingId(ev.id);
    setForm(formFromEvent(ev));
    setError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setError("");
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (form.recurrence === "once" && !form.eventDate) {
      setError("Pick a date for a one-time event.");
      return;
    }
    setSaving(true);
    const input = inputFromForm(form);
    const result = editingId
      ? await updateEvent(editingId, input)
      : await createEvent(input);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save the event.");
      return;
    }
    startCreate();
    await load();
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    await deleteEvent(id);
    if (editingId === id) startCreate();
    await load();
  }

  // Events sorted by their next occurrence for the list (past one-timers last).
  const now = new Date();
  const sorted = [...events].sort((a, b) => {
    const na = nextOccurrence(a, now)?.getTime() ?? Infinity;
    const nb = nextOccurrence(b, now)?.getTime() ?? Infinity;
    return na - nb;
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
        Admin
      </p>
      <h1 className="mt-1 flex items-center gap-2 text-3xl sm:text-4xl">
        <CalendarClock className="h-7 w-7 text-brand-500" />
        Events
      </h1>
      <p className="mt-2 text-ink-500">
        Create the events shown in everyone&apos;s &ldquo;Upcoming Events&rdquo; sidebar.
      </p>

      {/* Create / edit form */}
      <div className="mt-6 rounded-3xl border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">
            {editingId ? "Edit event" : "New event"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
            >
              <X className="h-4 w-4" /> Cancel edit
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Live AI Agent Build Workshop"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">
              Link <span className="font-normal text-ink-300">(optional)</span>
            </label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-700">
                Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-700">
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                className={inputClass}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-700">
              Repeats
            </label>
            <div className="flex gap-1.5 rounded-xl bg-surface-3 p-1">
              {(["once", "weekly", "monthly"] as Recurrence[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("recurrence", r)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-sm font-semibold capitalize transition-colors",
                    form.recurrence === r
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-500 hover:text-ink-900",
                  )}
                >
                  {r === "once" ? "One-time" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional schedule field */}
          {form.recurrence === "once" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-700">
                Date
              </label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          {form.recurrence === "weekly" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-700">
                Day of week
              </label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => set("dayOfWeek", Number(e.target.value))}
                className={inputClass}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.recurrence === "monthly" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-700">
                Day of month
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={form.dayOfMonth}
                onChange={(e) => set("dayOfMonth", Number(e.target.value))}
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : editingId ? (
                "Save changes"
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Create event
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Existing events */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-ink-500">
        All events
      </h2>
      {loading ? (
        <div className="flex items-center gap-2 text-ink-300">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center text-ink-300">
          No events yet. Create your first one above.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((ev) => (
            <li
              key={ev.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">{ev.title}</p>
                <p className="mt-0.5 text-xs text-ink-400">{scheduleSummary(ev)}</p>
                {ev.link && (
                  <a
                    href={ev.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
                  >
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{ev.link}</span>
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {confirmDelete === ev.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-surface-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(ev)}
                      aria-label={`Edit ${ev.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-surface-2 hover:text-ink-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(ev.id)}
                      aria-label={`Delete ${ev.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminGuard>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <EventsAdminContent />
      </motion.div>
    </AdminGuard>
  );
}
