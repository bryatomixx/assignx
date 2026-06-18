import type { LucideIcon } from "lucide-react";
import type { VideoSource } from "@/lib/video";

export type { VideoSource } from "@/lib/video";

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
  /** Public self-description shown on profile and preview card. */
  bio?: string;
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

/**
 * A task attached to a single chapter. Either a written task (text + optional
 * checklist) or a "watch this and replicate" video task. The task lives INSIDE
 * the chapter (Model A): there is no single homework block at the bottom of the
 * lesson; each chapter can carry its own task.
 */
export interface ChapterTask {
  type: "text" | "video";
  /** Short instruction line, e.g. "Connect your Stripe account". */
  title: string;
  /** Optional longer body / steps. */
  body?: string;
  /** Optional checklist shown under the task (text tasks). */
  bullets?: Bullet[];
  /** Share/watch URL (YouTube or Loom) for video tasks. */
  video?: string;
}

/**
 * A chapter is the self-contained unit of a lesson: a teaching video, its own
 * description, and its own optional task. Chapters render as the left rail
 * ("What you'll cover"); selecting one loads its video + description + task in
 * the main pane.
 */
export interface Chapter {
  id: string;
  title: string;
  /** Description shown under the chapter video. */
  description?: string;
  /**
   * Share/watch URL of the teaching video (YouTube or Loom). Absent -> simulated
   * placeholder player. YouTube gets the rich player; Loom a clean native embed.
   */
  video?: string;
  /** Player duration in seconds (also used by the simulated player). */
  durationSec?: number;
  /** Optional per-chapter task (text or video). */
  task?: ChapterTask;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  durationMin: number;
  /**
   * "video" lessons show the player; "text" lessons (e.g. prompt/SOP lessons,
   * marked "not a video") render their content with no player. Defaults to "video".
   */
  kind?: "video" | "text";
  /** Teaching video URL (YouTube or Loom). Absent -> simulated placeholder player. */
  video?: string;
  /** Short intro / description shown under the player. Supports [label](url) links and bare URLs. */
  content?: string;
  /** Optional banner image (e.g. a sales-deck preview) shown above the content. Public path like "/decks/foo.png". */
  image?: string;
  /** Alt text for `image`. */
  imageAlt?: string;
  /** Optional downloads / links. */
  resources?: Resource[];
  // ---- legacy (unused by the new module/lesson model, kept for type compat) ----
  videoUrl?: string;
  chapters?: Chapter[];
  sections?: LessonSection[];
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

/** A single video clip inside a lesson playlist (the player unit). */
export interface Clip {
  id: string;
  title: string;
  durationSec: number;
  /**
   * Resolved video source for this clip.
   *   - youtube -> rich custom player (YT IFrame API)
   *   - loom    -> clean native embed
   *   - absent  -> simulated placeholder player
   */
  video?: VideoSource;
}

/** Derived helpers used across the UI. */
export interface ModuleProgress {
  moduleId: string;
  total: number;
  completed: number;
  pct: number; // 0-100
}

// ---- Community Board types ----

export type PostStatus = "pending" | "approved" | "rejected";
export type PostMediaType = "text" | "image" | "video" | "link";

export interface Post {
  id: string;
  authorId: string;
  body: string;
  mediaType: PostMediaType;
  mediaPayload: string | null; // URL for 'link'; null placeholder for image/video (Supabase later)
  status: PostStatus;
  pinned: boolean;
  createdAt: string; // ISO
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  pinned: boolean;
  createdAt: string; // ISO
}

export interface Like {
  userId: string;
  postId: string;
}

export interface Follow {
  followerId: string;
  followeeId: string;
}

export interface CommunitySettings {
  globalApproval: boolean;
  autoApproveUserIds: string[];
}

export interface ModPermissions {
  canApprovePosts: boolean;
  canDeletePosts: boolean;
  canDeleteComments: boolean;
  canPinContent: boolean;
  canManageApproval: boolean;
}

export type CommunityRole = "admin" | "mod" | "student";

/** Furthest position watched per clip per user. Keyed map persisted as array. */
export interface VideoProgress {
  userId: string;
  lessonId: string;
  clipIndex: number;
  elapsedSec: number;
  durationSec: number;
}

// ---- Notification types ----

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "post_approved"
  | "post_rejected"
  | "post_pending"
  // Broadcast to every member when the community owner (Noah) publishes a post.
  | "announcement";

export interface AppNotification {
  id: string;
  recipientId: string; // who sees it
  actorId: string; // who triggered it
  type: NotificationType;
  postId: string | null; // related post if any
  createdAt: string; // ISO
  read: boolean;
}
