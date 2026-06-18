/**
 * Upcoming community/academy events shown in the sidebar widget.
 * Frontend-only mock data (like lib/mock/*), to be swapped for a real source.
 */

export interface AcademyEvent {
  id: string;
  title: string;
  /** Human-readable date, e.g. "Jun 20, 2026". */
  date: string;
  /** Human-readable time, e.g. "2:00 PM EST". */
  time: string;
}

export const UPCOMING_EVENTS: AcademyEvent[] = [
  {
    id: "ev-live-build",
    title: "Live AI Agent Build Workshop",
    date: "Jun 20, 2026",
    time: "2:00 PM EST",
  },
  {
    id: "ev-office-hours",
    title: "Office Hours: Stripe & Twilio Setup",
    date: "Jun 24, 2026",
    time: "11:00 AM EST",
  },
  {
    id: "ev-deck-teardown",
    title: "Sales Deck Teardown (Live)",
    date: "Jun 27, 2026",
    time: "1:00 PM EST",
  },
  {
    id: "ev-cohort-qa",
    title: "Cohort Q&A + Wins",
    date: "Jul 1, 2026",
    time: "3:00 PM EST",
  },
];
