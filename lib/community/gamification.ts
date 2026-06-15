import type { Post, Comment, Like, Follow } from "@/lib/types";

// ---- Point constants ----

export const POINTS = {
  post: 10,
  comment: 3,
  likeReceived: 2,
  commentReceived: 2,
  follower: 5,
} as const;

// ---- Level definitions ----

export interface LevelDef {
  level: number;
  name: string;
  min: number;
}

export interface LevelInfo extends LevelDef {
  nextAt: number | null;
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: "Newcomer", min: 0 },
  { level: 2, name: "Contributor", min: 50 },
  { level: 3, name: "Regular", min: 150 },
  { level: 4, name: "Top Voice", min: 350 },
  { level: 5, name: "Legend", min: 700 },
];

/** Returns the level info for the given all-time points total. */
export function levelFor(points: number): LevelInfo {
  let current = LEVELS[0];
  for (const def of LEVELS) {
    if (points >= def.min) current = def;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;
  return { ...current, nextAt: next ? next.min : null };
}

// ---- Badge definitions ----

export interface Badge {
  id: string;
  label: string;
  description: string;
  /** Lucide icon name as a string; the UI resolves the component. */
  icon: string;
}

export interface BadgeDef extends Badge {
  /** Pure predicate: returns true when the badge has been earned. */
  earned: (stats: UserStats) => boolean;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-post",
    label: "First Post",
    description: "Published your first approved post.",
    icon: "PenLine",
    earned: (s) => s.postCount >= 1,
  },
  {
    id: "conversationalist",
    label: "Conversationalist",
    description: "Left 10 or more comments.",
    icon: "MessageCircle",
    earned: (s) => s.commentCount >= 10,
  },
  {
    id: "crowd-favorite",
    label: "Crowd Favorite",
    description: "Received 25 or more likes on your posts.",
    icon: "Heart",
    earned: (s) => s.likesReceived >= 25,
  },
  {
    id: "well-connected",
    label: "Well Connected",
    description: "Gained 5 or more followers.",
    icon: "Users",
    earned: (s) => s.followerCount >= 5,
  },
  {
    id: "mentor",
    label: "Mentor",
    description: "Received 10 or more comments on your posts.",
    icon: "Sparkles",
    earned: (s) => s.commentsReceived >= 10,
  },
  {
    id: "legend",
    label: "Legend",
    description: "Reached 700 all-time points.",
    icon: "Crown",
    earned: (s) => s.points >= 700,
  },
];

/** All badge metadata without the predicate (safe to expose to UI). */
export const ALL_BADGES: Badge[] = BADGE_DEFS.map((d) => ({
  id: d.id,
  label: d.label,
  description: d.description,
  icon: d.icon,
}));

/** Returns the subset of badges the user has earned given their stats. */
export function badgesFor(stats: UserStats): Badge[] {
  return BADGE_DEFS.filter((def) => def.earned(stats)).map((def) => ({
    id: def.id,
    label: def.label,
    description: def.description,
    icon: def.icon,
  }));
}

// ---- Stats ----

export interface UserStats {
  postCount: number;
  commentCount: number;
  likesReceived: number;
  commentsReceived: number;
  followerCount: number;
  points: number;
}

export interface BoardData {
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  follows: Follow[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes a user's stats from raw board data.
 *
 * @param userId - target user
 * @param data - raw board slices (posts / comments / likes / follows)
 * @param range - 'all' for all-time, 'week' for the last 7 days
 * @param now - current epoch ms (pass Date.now() from the caller; never call
 *              new Date() inside this function so it stays pure and SSR-safe)
 */
export function computeStats(
  userId: string,
  data: BoardData,
  range: "all" | "week",
  now: number,
): UserStats {
  const cutoff = now - SEVEN_DAYS_MS;

  const inWindow = (iso: string): boolean =>
    range === "all" || new Date(iso).getTime() >= cutoff;

  // Posts authored by this user that are approved
  const userApprovedPosts = data.posts.filter(
    (p) => p.authorId === userId && p.status === "approved",
  );

  const postCount = userApprovedPosts.filter((p) =>
    inWindow(p.createdAt),
  ).length;

  // Comments written by this user
  const commentCount = data.comments.filter(
    (c) => c.authorId === userId && inWindow(c.createdAt),
  ).length;

  // Likes received on the user's approved posts
  // Likes have no timestamp so they only count in the 'all' range
  const userApprovedPostIds = new Set(userApprovedPosts.map((p) => p.id));
  const likesReceived =
    range === "all"
      ? data.likes.filter((l) => userApprovedPostIds.has(l.postId)).length
      : 0;

  // Comments from OTHER users on the user's approved posts
  const commentsReceived = data.comments.filter(
    (c) =>
      c.authorId !== userId &&
      userApprovedPostIds.has(c.postId) &&
      inWindow(c.createdAt),
  ).length;

  // Follows have no timestamp so they only count in the 'all' range
  const followerCount =
    range === "all"
      ? data.follows.filter((f) => f.followeeId === userId).length
      : 0;

  const points =
    postCount * POINTS.post +
    commentCount * POINTS.comment +
    likesReceived * POINTS.likeReceived +
    commentsReceived * POINTS.commentReceived +
    followerCount * POINTS.follower;

  return {
    postCount,
    commentCount,
    likesReceived,
    commentsReceived,
    followerCount,
    points,
  };
}

// ---- Leaderboard ----

export interface LeaderboardEntry {
  userId: string;
  points: number;
  postCount: number;
  likesReceived: number;
  commentsReceived: number;
  level: number;
  levelName: string;
}

/**
 * Builds a leaderboard sorted descending by points for the given range.
 * Users with 0 points in the requested range are excluded.
 * Admins are NOT excluded.
 *
 * @param userIds - all user ids to consider
 * @param data - raw board slices
 * @param range - 'all' or 'week'
 * @param now - current epoch ms (pass Date.now() from the caller)
 */
export function leaderboard(
  userIds: string[],
  data: BoardData,
  range: "all" | "week",
  now: number,
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const userId of userIds) {
    const stats = computeStats(userId, data, range, now);
    if (stats.points === 0) continue;
    const lvl = levelFor(stats.points);
    entries.push({
      userId,
      points: stats.points,
      postCount: stats.postCount,
      likesReceived: stats.likesReceived,
      commentsReceived: stats.commentsReceived,
      level: lvl.level,
      levelName: lvl.name,
    });
  }

  return entries.sort((a, b) => b.points - a.points);
}
