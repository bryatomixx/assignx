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

/** A single video clip inside a lesson playlist. */
export interface Clip {
  id: string;
  title: string;
  durationSec: number;
  /**
   * YouTube video ID for this clip (e.g. "dQw4w9WgXcQ").
   * When present, the real YouTube IFrame player is used.
   * When absent, the simulated placeholder player is used.
   */
  videoId?: string;
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
  | "post_pending";

export interface AppNotification {
  id: string;
  recipientId: string; // who sees it
  actorId: string; // who triggered it
  type: NotificationType;
  postId: string | null; // related post if any
  createdAt: string; // ISO
  read: boolean;
}
