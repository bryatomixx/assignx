import type {
  User,
  Progress,
  HomeworkRecord,
  Post,
  Comment,
  Like,
  Follow,
  CommunitySettings,
  ModPermissions,
  VideoProgress,
} from "@/lib/types";
import {
  SEED_USERS,
  SEED_PROGRESS,
  SEED_HOMEWORK,
  DEFAULT_USER_ID,
} from "@/lib/mock/users";
import {
  SEED_POSTS,
  SEED_COMMENTS,
  SEED_LIKES,
  SEED_FOLLOWS,
  SEED_COMMUNITY_SETTINGS,
  SEED_MODS,
} from "@/lib/mock/board";

/**
 * SSR-safe localStorage layer. This is the ONLY place that touches persistence.
 * Swapping to a real backend later means replacing this file (and the data
 * functions in lib/mock) with API calls -- the UI never reads localStorage directly.
 */

const KEYS = {
  users: "assignx.users",
  progress: "assignx.progress",
  homework: "assignx.homework",
  currentUser: "assignx.currentUser",
  posts: "assignx.posts",
  comments: "assignx.comments",
  likes: "assignx.likes",
  follows: "assignx.follows",
  communitySettings: "assignx.communitySettings",
  mods: "assignx.mods",
  videoProgress: "assignx.videoProgress",
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

// ---- Community Board helpers ----

export function loadPosts(): Post[] {
  return read<Post[]>(KEYS.posts, SEED_POSTS);
}

export function savePosts(posts: Post[]): void {
  write(KEYS.posts, posts);
}

export function loadComments(): Comment[] {
  return read<Comment[]>(KEYS.comments, SEED_COMMENTS);
}

export function saveComments(comments: Comment[]): void {
  write(KEYS.comments, comments);
}

export function loadLikes(): Like[] {
  return read<Like[]>(KEYS.likes, SEED_LIKES);
}

export function saveLikes(likes: Like[]): void {
  write(KEYS.likes, likes);
}

export function loadFollows(): Follow[] {
  return read<Follow[]>(KEYS.follows, SEED_FOLLOWS);
}

export function saveFollows(follows: Follow[]): void {
  write(KEYS.follows, follows);
}

export function loadCommunitySettings(): CommunitySettings {
  return read<CommunitySettings>(KEYS.communitySettings, SEED_COMMUNITY_SETTINGS);
}

export function saveCommunitySettings(settings: CommunitySettings): void {
  write(KEYS.communitySettings, settings);
}

/** mods is a map of userId -> ModPermissions */
export function loadMods(): Record<string, ModPermissions> {
  return read<Record<string, ModPermissions>>(KEYS.mods, SEED_MODS);
}

export function saveMods(mods: Record<string, ModPermissions>): void {
  write(KEYS.mods, mods);
}

export function loadVideoProgress(): VideoProgress[] {
  return read<VideoProgress[]>(KEYS.videoProgress, []);
}

export function saveVideoProgress(vp: VideoProgress[]): void {
  write(KEYS.videoProgress, vp);
}

export function resetDemo(): void {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
}
