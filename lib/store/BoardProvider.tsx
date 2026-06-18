"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Post,
  PostMediaType,
  Comment,
  Like,
  Follow,
  CommunitySettings,
  ModPermissions,
  CommunityRole,
  AppNotification,
} from "@/lib/types";
import {
  computeStats,
  leaderboard as pureLeaderboard,
  levelFor,
  badgesFor,
} from "@/lib/community/gamification";
import type { LeaderboardEntry, UserStats, Badge, LevelInfo } from "@/lib/community/gamification";
import {
  fetchCommunityState,
  createPost as apiCreatePost,
  approvePost as apiApprovePost,
  rejectPost as apiRejectPost,
  deletePost as apiDeletePost,
  pinPost as apiPinPost,
  unpinPost as apiUnpinPost,
  likePost as apiLikePost,
  unlikePost as apiUnlikePost,
  addComment as apiAddComment,
  deleteComment as apiDeleteComment,
  pinComment as apiPinComment,
  unpinComment as apiUnpinComment,
  follow as apiFollow,
  unfollow as apiUnfollow,
  setGlobalApproval as apiSetGlobalApproval,
  setAutoApprove as apiSetAutoApprove,
  promoteMod as apiPromoteMod,
  demoteMod as apiDemoteMod,
  setModPermission as apiSetModPermission,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  purgeUser as apiPurgeUser,
} from "@/lib/community/api";
import { useAcademy } from "@/lib/store/AcademyProvider";

// ---- Context interface ----

interface BoardContextValue {
  ready: boolean;

  // Feed
  feed: (tab: "all" | "following") => Post[];
  pendingPosts: () => Post[];
  approvedPosts: () => Post[];
  rejectedPosts: () => Post[];
  myPendingPosts: () => Post[];
  myRejectedPosts: () => Post[];
  commentsFor: (postId: string) => Comment[];
  likeCount: (postId: string) => number;
  isLiked: (postId: string, userId?: string) => boolean;
  commentCount: (postId: string) => number;
  roleOf: (userId: string) => CommunityRole;

  // Post mutations
  createPost: (input: {
    body: string;
    mediaType: PostMediaType;
    mediaPayload: string | null;
  }) => Post | null;
  approvePost: (postId: string) => void;
  rejectPost: (postId: string) => void;
  deletePost: (postId: string) => void;
  pinPost: (postId: string) => void;
  unpinPost: (postId: string) => void;

  // Like mutations
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;

  // Comment mutations
  addComment: (postId: string, body: string) => Comment | null;
  deleteComment: (commentId: string) => void;
  pinComment: (commentId: string) => void;
  unpinComment: (commentId: string) => void;

  // Follow mutations
  follow: (userId: string) => void;
  unfollow: (userId: string) => void;
  isFollowing: (userId: string, followerId?: string) => boolean;
  followerCount: (userId: string) => number;
  followingCount: (userId: string) => number;

  // Settings (admin)
  settings: CommunitySettings;
  setGlobalApproval: (value: boolean) => void;
  setAutoApprove: (userId: string, enabled: boolean) => void;

  // Mod management (admin)
  getMod: (userId: string) => ModPermissions | null;
  isMod: (userId: string) => boolean;
  promoteMod: (userId: string) => void;
  demoteMod: (userId: string) => void;
  setModPermission: (
    userId: string,
    key: keyof ModPermissions,
    value: boolean,
  ) => void;

  // Permission checks (default to currentUser)
  canApprovePosts: (userId?: string) => boolean;
  canDeletePosts: (userId?: string) => boolean;
  canDeleteComments: (userId?: string) => boolean;
  canPinContent: (userId?: string) => boolean;
  canManageApproval: (userId?: string) => boolean;
  canDeletePost: (postId: string) => boolean;
  canDeleteComment: (commentId: string) => boolean;

  // Analytics
  postCountBy: (userId: string) => number;
  approvedPostCountBy: (userId: string) => number;
  commentsBy: (userId: string) => Comment[];
  likesGivenBy: (userId: string) => Like[];
  commentedPostIdsBy: (userId: string) => string[];
  likedPostsBy: (userId: string) => Post[];
  /** All posts authored by userId (all statuses), newest first. Admin view. */
  postsBy: (userId: string) => Post[];
  /** userIds of accounts that follow userId. */
  followersOf: (userId: string) => string[];
  /** userIds that userId follows. */
  followingOf: (userId: string) => string[];

  // Notifications
  notificationsFor: (userId?: string) => AppNotification[];
  unreadCount: (userId?: string) => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId?: string) => void;

  // Post lookup
  getPost: (postId: string) => Post | undefined;

  // Cascade delete (purge all board data for a user)
  purgeUser: (userId: string) => void;

  // Gamification
  leaderboard: (range: "all" | "week") => LeaderboardEntry[];
  gamificationFor: (userId: string) => {
    points: number;
    level: number;
    levelName: string;
    nextAt: number | null;
    badges: Badge[];
    stats: UserStats;
  };
}

const BoardContext = createContext<BoardContextValue | null>(null);

// ---- Sort helpers ----

function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function sortComments(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

// ---- Provider ----

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const academy = useAcademy();

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  // autoApproveUserIds is managed server-side; we keep an empty array client-side
  // because the server already enforces per-user auto-approve rules on mutations.
  const [settings, setSettingsState] = useState<CommunitySettings>({
    globalApproval: true,
    autoApproveUserIds: [],
  });
  const [mods, setModsState] = useState<Record<string, ModPermissions>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ready, setReady] = useState(false);

  // ---- Fetch helper: load full state from the server API ----

  const loadState = useCallback(async () => {
    try {
      const state = await fetchCommunityState();
      setPosts(state.posts);
      setComments(state.comments);
      setLikes(state.likes);
      setFollows(state.follows);
      setSettingsState({
        globalApproval: state.settings.globalApproval,
        // autoApproveUserIds lives on the server; expose an empty array to the
        // client since the UI never needs to enumerate it directly.
        autoApproveUserIds: [],
      });
      setModsState(state.mods);
      setNotifications(state.notifications);
    } catch {
      // Leave whatever state is already in memory so the UI does not go blank.
    } finally {
      setReady(true);
    }
  }, []);

  // Hydrate from the server API on mount. loadState setStates after an await
  // (canonical load-on-mount); the lint guard is the same one used for the
  // other hydrate-on-mount effects in this codebase.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadState();
  }, [loadState]);

  // ---- Current user helpers ----

  const currentUser = academy.currentUser;
  const currentUserId = currentUser?.id ?? "";

  const roleOf = useCallback(
    (userId: string): CommunityRole => {
      const user = academy.users.find((u) => u.id === userId);
      if (user?.role === "admin") return "admin";
      if (mods[userId]) return "mod";
      return "student";
    },
    [academy.users, mods],
  );

  // ---- Permission helpers ----

  const canApprovePosts = useCallback(
    (userId?: string): boolean => {
      const uid = userId ?? currentUserId;
      const role = roleOf(uid);
      if (role === "admin") return true;
      if (role === "mod") return mods[uid]?.canApprovePosts ?? false;
      return false;
    },
    [currentUserId, roleOf, mods],
  );

  const canDeletePosts = useCallback(
    (userId?: string): boolean => {
      const uid = userId ?? currentUserId;
      const role = roleOf(uid);
      if (role === "admin") return true;
      if (role === "mod") return mods[uid]?.canDeletePosts ?? false;
      return false;
    },
    [currentUserId, roleOf, mods],
  );

  const canDeleteComments = useCallback(
    (userId?: string): boolean => {
      const uid = userId ?? currentUserId;
      const role = roleOf(uid);
      if (role === "admin") return true;
      if (role === "mod") return mods[uid]?.canDeleteComments ?? false;
      return false;
    },
    [currentUserId, roleOf, mods],
  );

  const canPinContent = useCallback(
    (userId?: string): boolean => {
      const uid = userId ?? currentUserId;
      // Pinning posts and comments is admin-only. Mods and students cannot pin.
      return roleOf(uid) === "admin";
    },
    [currentUserId, roleOf],
  );

  const canManageApproval = useCallback(
    (userId?: string): boolean => {
      const uid = userId ?? currentUserId;
      const role = roleOf(uid);
      if (role === "admin") return true;
      if (role === "mod") return mods[uid]?.canManageApproval ?? false;
      return false;
    },
    [currentUserId, roleOf, mods],
  );

  // Owner of a post can always delete it; mods/admins can also delete.
  const canDeletePost = useCallback(
    (postId: string): boolean => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return false;
      if (post.authorId === currentUserId) return true;
      return canDeletePosts(currentUserId);
    },
    [posts, currentUserId, canDeletePosts],
  );

  // Owner of a comment can always delete it; mods/admins with permission can also delete.
  const canDeleteComment = useCallback(
    (commentId: string): boolean => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return false;
      if (comment.authorId === currentUserId) return true;
      return canDeleteComments(currentUserId);
    },
    [comments, currentUserId, canDeleteComments],
  );

  // ---- Feed ----

  const feed = useCallback(
    (tab: "all" | "following"): Post[] => {
      let approved = posts.filter((p) => p.status === "approved");
      if (tab === "following") {
        const followingIds = follows
          .filter((f) => f.followerId === currentUserId)
          .map((f) => f.followeeId);
        approved = approved.filter((p) => followingIds.includes(p.authorId));
      }
      return sortPosts(approved);
    },
    [posts, follows, currentUserId],
  );

  const pendingPosts = useCallback(
    (): Post[] => posts.filter((p) => p.status === "pending"),
    [posts],
  );

  const approvedPosts = useCallback(
    (): Post[] =>
      [...posts.filter((p) => p.status === "approved")].sort((a, b) => {
        const aTime = a.approvedAt ?? a.createdAt;
        const bTime = b.approvedAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      }),
    [posts],
  );

  const rejectedPosts = useCallback(
    (): Post[] =>
      [...posts.filter((p) => p.status === "rejected")].sort((a, b) => {
        const aTime = a.rejectedAt ?? a.createdAt;
        const bTime = b.rejectedAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      }),
    [posts],
  );

  const myPendingPosts = useCallback(
    (): Post[] =>
      posts.filter(
        (p) => p.authorId === currentUserId && p.status === "pending",
      ),
    [posts, currentUserId],
  );

  const myRejectedPosts = useCallback(
    (): Post[] =>
      posts.filter(
        (p) => p.authorId === currentUserId && p.status === "rejected",
      ),
    [posts, currentUserId],
  );

  const commentsFor = useCallback(
    (postId: string): Comment[] =>
      sortComments(comments.filter((c) => c.postId === postId)),
    [comments],
  );

  const likeCount = useCallback(
    (postId: string): number =>
      likes.filter((l) => l.postId === postId).length,
    [likes],
  );

  const isLiked = useCallback(
    (postId: string, userId?: string): boolean => {
      const uid = userId ?? currentUserId;
      return likes.some((l) => l.postId === postId && l.userId === uid);
    },
    [likes, currentUserId],
  );

  const commentCount = useCallback(
    (postId: string): number =>
      comments.filter((c) => c.postId === postId).length,
    [comments],
  );

  // ---- Post mutations ----

  const createPost = useCallback(
    (input: {
      body: string;
      mediaType: PostMediaType;
      mediaPayload: string | null;
    }): Post | null => {
      if (!currentUserId) return null;
      // Fire-and-forget: kick off the async call then refetch to sync state.
      void apiCreatePost(currentUserId, input).then(() => loadState());
      return null;
    },
    [currentUserId, loadState],
  );

  const approvePost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      void apiApprovePost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const rejectPost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      void apiRejectPost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const deletePost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      void apiDeletePost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const pinPost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      void apiPinPost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const unpinPost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      void apiUnpinPost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Like mutations ----

  const likePost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      // Optimistic update: add the like locally before the server responds.
      setLikes((prev) => {
        if (prev.some((l) => l.postId === postId && l.userId === currentUserId)) {
          return prev;
        }
        return [...prev, { userId: currentUserId, postId }];
      });
      void apiLikePost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const unlikePost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      // Optimistic update: remove the like locally before the server responds.
      setLikes((prev) =>
        prev.filter(
          (l) => !(l.postId === postId && l.userId === currentUserId),
        ),
      );
      void apiUnlikePost(currentUserId, postId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Comment mutations ----

  const addComment = useCallback(
    (postId: string, body: string): Comment | null => {
      if (!currentUserId) return null;
      void apiAddComment(currentUserId, postId, body).then(() => loadState());
      return null;
    },
    [currentUserId, loadState],
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      if (!currentUserId) return;
      void apiDeleteComment(currentUserId, commentId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const pinComment = useCallback(
    (commentId: string) => {
      if (!currentUserId) return;
      void apiPinComment(currentUserId, commentId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const unpinComment = useCallback(
    (commentId: string) => {
      if (!currentUserId) return;
      void apiUnpinComment(currentUserId, commentId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Follow mutations ----

  const isFollowing = useCallback(
    (userId: string, followerId?: string): boolean => {
      const fid = followerId ?? currentUserId;
      return follows.some(
        (f) => f.followerId === fid && f.followeeId === userId,
      );
    },
    [follows, currentUserId],
  );

  const follow = useCallback(
    (userId: string) => {
      if (!currentUserId || userId === currentUserId) return;
      void apiFollow(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const unfollow = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiUnfollow(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const followerCount = useCallback(
    (userId: string): number =>
      follows.filter((f) => f.followeeId === userId).length,
    [follows],
  );

  const followingCount = useCallback(
    (userId: string): number =>
      follows.filter((f) => f.followerId === userId).length,
    [follows],
  );

  // ---- Settings (admin) ----

  const setGlobalApproval = useCallback(
    (value: boolean) => {
      if (!currentUserId) return;
      void apiSetGlobalApproval(currentUserId, value).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const setAutoApprove = useCallback(
    (userId: string, enabled: boolean) => {
      if (!currentUserId) return;
      void apiSetAutoApprove(currentUserId, userId, enabled).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Mod management (admin only) ----

  const getMod = useCallback(
    (userId: string): ModPermissions | null => mods[userId] ?? null,
    [mods],
  );

  const isMod = useCallback(
    (userId: string): boolean => userId in mods,
    [mods],
  );

  const promoteMod = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiPromoteMod(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const demoteMod = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiDemoteMod(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const setModPermission = useCallback(
    (userId: string, key: keyof ModPermissions, value: boolean) => {
      if (!currentUserId) return;
      void apiSetModPermission(currentUserId, userId, key, value).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Analytics ----

  const postCountBy = useCallback(
    (userId: string): number =>
      posts.filter((p) => p.authorId === userId).length,
    [posts],
  );

  const approvedPostCountBy = useCallback(
    (userId: string): number =>
      posts.filter((p) => p.authorId === userId && p.status === "approved").length,
    [posts],
  );

  const commentsBy = useCallback(
    (userId: string): Comment[] =>
      comments.filter((c) => c.authorId === userId),
    [comments],
  );

  const likesGivenBy = useCallback(
    (userId: string): Like[] => likes.filter((l) => l.userId === userId),
    [likes],
  );

  const commentedPostIdsBy = useCallback(
    (userId: string): string[] => [
      ...new Set(
        comments.filter((c) => c.authorId === userId).map((c) => c.postId),
      ),
    ],
    [comments],
  );

  const likedPostsBy = useCallback(
    (userId: string): Post[] => {
      const likedIds = likes
        .filter((l) => l.userId === userId)
        .map((l) => l.postId);
      return posts.filter((p) => likedIds.includes(p.id));
    },
    [likes, posts],
  );

  // All posts by a user regardless of status, newest first (admin view).
  const postsBy = useCallback(
    (userId: string): Post[] =>
      [...posts.filter((p) => p.authorId === userId)].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [posts],
  );

  // UserIds of accounts that follow userId.
  const followersOf = useCallback(
    (userId: string): string[] =>
      follows.filter((f) => f.followeeId === userId).map((f) => f.followerId),
    [follows],
  );

  // UserIds that userId follows.
  const followingOf = useCallback(
    (userId: string): string[] =>
      follows.filter((f) => f.followerId === userId).map((f) => f.followeeId),
    [follows],
  );

  // ---- Notification getters ----

  const notificationsFor = useCallback(
    (userId?: string): AppNotification[] => {
      const uid = userId ?? currentUserId;
      return [...notifications.filter((n) => n.recipientId === uid)].sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt),
      );
    },
    [notifications, currentUserId],
  );

  const unreadCount = useCallback(
    (userId?: string): number => {
      const uid = userId ?? currentUserId;
      return notifications.filter((n) => n.recipientId === uid && !n.read).length;
    },
    [notifications, currentUserId],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      if (!currentUserId) return;
      void apiMarkNotificationRead(currentUserId, id).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const markAllNotificationsRead = useCallback(
    (userId?: string) => {
      const uid = userId ?? currentUserId;
      if (!uid) return;
      void apiMarkAllNotificationsRead(uid).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Post lookup ----

  const getPost = useCallback(
    (postId: string): Post | undefined => posts.find((p) => p.id === postId),
    [posts],
  );

  // ---- Cascade purge ----

  const purgeUser = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiPurgeUser(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Gamification ----

  const leaderboardFn = useCallback(
    (range: "all" | "week"): LeaderboardEntry[] => {
      const userIds = academy.users.map((u) => u.id);
      const data = { posts, comments, likes, follows };
      return pureLeaderboard(userIds, data, range, Date.now());
    },
    [academy.users, posts, comments, likes, follows],
  );

  const gamificationFor = useCallback(
    (
      userId: string,
    ): {
      points: number;
      level: number;
      levelName: string;
      nextAt: number | null;
      badges: Badge[];
      stats: UserStats;
    } => {
      const data = { posts, comments, likes, follows };
      const stats = computeStats(userId, data, "all", Date.now());
      const lvlInfo: LevelInfo = levelFor(stats.points);
      const badges = badgesFor(stats);
      return {
        points: stats.points,
        level: lvlInfo.level,
        levelName: lvlInfo.name,
        nextAt: lvlInfo.nextAt,
        badges,
        stats,
      };
    },
    [posts, comments, likes, follows],
  );

  // ---- Context value ----

  const value = useMemo<BoardContextValue>(
    () => ({
      ready,
      feed,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
      myPendingPosts,
      myRejectedPosts,
      commentsFor,
      likeCount,
      isLiked,
      commentCount,
      roleOf,
      createPost,
      approvePost,
      rejectPost,
      deletePost,
      pinPost,
      unpinPost,
      likePost,
      unlikePost,
      addComment,
      deleteComment,
      pinComment,
      unpinComment,
      follow,
      unfollow,
      isFollowing,
      followerCount,
      followingCount,
      settings,
      setGlobalApproval,
      setAutoApprove,
      getMod,
      isMod,
      promoteMod,
      demoteMod,
      setModPermission,
      canApprovePosts,
      canDeletePosts,
      canDeleteComments,
      canPinContent,
      canManageApproval,
      canDeletePost,
      canDeleteComment,
      postCountBy,
      approvedPostCountBy,
      commentsBy,
      likesGivenBy,
      commentedPostIdsBy,
      likedPostsBy,
      postsBy,
      followersOf,
      followingOf,
      getPost,
      notificationsFor,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      purgeUser,
      leaderboard: leaderboardFn,
      gamificationFor,
    }),
    [
      ready,
      feed,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
      myPendingPosts,
      myRejectedPosts,
      commentsFor,
      likeCount,
      isLiked,
      commentCount,
      roleOf,
      createPost,
      approvePost,
      rejectPost,
      deletePost,
      pinPost,
      unpinPost,
      likePost,
      unlikePost,
      addComment,
      deleteComment,
      pinComment,
      unpinComment,
      follow,
      unfollow,
      isFollowing,
      followerCount,
      followingCount,
      settings,
      setGlobalApproval,
      setAutoApprove,
      getMod,
      isMod,
      promoteMod,
      demoteMod,
      setModPermission,
      canApprovePosts,
      canDeletePosts,
      canDeleteComments,
      canPinContent,
      canManageApproval,
      canDeletePost,
      canDeleteComment,
      postCountBy,
      approvedPostCountBy,
      commentsBy,
      likesGivenBy,
      commentedPostIdsBy,
      likedPostsBy,
      postsBy,
      followersOf,
      followingOf,
      getPost,
      notificationsFor,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      purgeUser,
      leaderboardFn,
      gamificationFor,
    ],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
