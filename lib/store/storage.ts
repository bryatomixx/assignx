import type { User, Progress, HomeworkRecord } from "@/lib/types";
import {
  SEED_USERS,
  SEED_PROGRESS,
  SEED_HOMEWORK,
  DEFAULT_USER_ID,
} from "@/lib/mock/users";

/**
 * SSR-safe localStorage layer. This is the ONLY place that touches persistence.
 * Swapping to a real backend later means replacing this file (and the data
 * functions in lib/mock) with API calls — the UI never reads localStorage directly.
 */

const KEYS = {
  users: "assignx.users",
  progress: "assignx.progress",
  homework: "assignx.homework",
  currentUser: "assignx.currentUser",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function loadUsers(): User[] {
  return read<User[]>(KEYS.users, SEED_USERS);
}

export function saveUsers(users: User[]): void {
  write(KEYS.users, users);
}

export function loadProgress(): Progress[] {
  return read<Progress[]>(KEYS.progress, SEED_PROGRESS);
}

export function saveProgress(progress: Progress[]): void {
  write(KEYS.progress, progress);
}

export function loadHomework(): HomeworkRecord[] {
  return read<HomeworkRecord[]>(KEYS.homework, SEED_HOMEWORK);
}

export function saveHomework(homework: HomeworkRecord[]): void {
  write(KEYS.homework, homework);
}

export function loadCurrentUserId(): string {
  return read<string>(KEYS.currentUser, DEFAULT_USER_ID);
}

export function saveCurrentUserId(id: string): void {
  write(KEYS.currentUser, id);
}

export function resetDemo(): void {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
}
