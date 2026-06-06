import type { LucideIcon } from "lucide-react";

export type Role = "admin" | "student";
export type Tier = "free" | "paid";
export type Status = "active" | "paused";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  /** Paid/locked modules the admin has granted this user. Free modules are always open. */
  unlockedModuleIds: string[];
  avatar: string; // emoji (assignx memoji style)
  joinedAt: string; // ISO date
  /** Access code used to sign in (demo login). */
  code?: string;
}

export interface Resource {
  id: string;
  label: string;
  href: string;
}

/** A bullet point that may nest further bullets (up to a few levels deep). */
export interface Bullet {
  text: string;
  href?: string; // optional inline link
  children?: Bullet[];
}

/** A titled block inside a lesson, e.g. "Workshop Material" or "Homework". */
export interface LessonSection {
  heading: string;
  bullets: Bullet[];
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  durationMin: number;
  videoUrl: string; // placeholder for now
  content: string; // short intro / summary
  sections?: LessonSection[];
  resources: Resource[];
}

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  access: Tier;
  Icon: LucideIcon; // lucide cover icon
  accent: string; // gradient css for the cover
  lessons: Lesson[];
}

export interface Progress {
  userId: string;
  completedLessonIds: string[];
}

/** Homework completion per user, by lesson id. */
export interface HomeworkRecord {
  userId: string;
  doneLessonIds: string[];
}

/** Derived helpers used across the UI. */
export interface ModuleProgress {
  moduleId: string;
  total: number;
  completed: number;
  pct: number; // 0-100
}
