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
  PostStatus,
  PostMediaType,
  Comment,
  Like,
  Follow,
  CommunitySettings,
  ModPermissions,
  CommunityRole,
  AppNotification,
  NotificationType,
} from "@/lib/types";
import {
  loadPosts,
  savePosts,
  loadComments,
  saveComments,
  loadLikes,
  saveLikes,
  loadFollows,
  saveFollows,
  loadCommunitySettings,
  saveCommunitySettings,
  loadMods,
  saveMods,
  loadNotifications,
  saveNotifications,
} from "@/lib/store/storage";
import { useAcademy } from "@/lib/store/AcademyProvider";

// ---- ID generation ----
// Uses Math.random so it works in both Node (tests) and browser without Date.now().
function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

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

  // Notifications
  notificationsFor: (userId?: string) => AppNotification[];
  unreadCount: (userId?: string) => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId?: string) => void;

  // Cascade delete (purge all board data for a user)
  purgeUser: (userId: string) => void;
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
  const [settings, setSettingsState] = useState<CommunitySettings>({
    globalApproval: true,
    autoApproveUserIds: [],
  });
  const [mods, setModsState] = useState<Record<string, ModPermissions>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on mount (client only). setState here is the
  // canonical hydrate-on-mount pattern (same as AcademyProvider).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosts(loadPosts());
    setComments(loadComments());
    setLikes(loadLikes());
    setFollows(loadFollows());
    setSettingsState(loadCommunitySettings());
    setModsState(loadMods());
    setNotifications(loadNotifications());
    setReady(true);
  }, []);

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
      const role = roleOf(uid);
      if (role === "admin") return true;
      if (role === "mod") return mods[uid]?.canPinContent ?? false;
      return false;
    },
    [currentUserId, roleOf, mods],
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

  // Owner of a post can always delete it; mods/admins can also delete
  const canDeletePost = useCallback(
    (postId: string): boolean => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return false;
      if (post.authorId === currentUserId) return true;
      return canDeletePosts(currentUserId);
    },
    [posts, currentUserId, canDeletePosts],
  );

  // Owner of a comment can always delete it; mods/admins with permission can also delete
  const canDeleteComment = useCallback(
    (commentId: string): boolean => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return false;
      if (comment.authorId === currentUserId) return true;
      return canDeleteComments(currentUserId);
    },
    [comments, currentUserId, canDeleteComments],
  );

  // ---- Notification helper (internal) ----

  // Creates a notification and persists it. Never notifies when recipient === actor.
  const pushNotification = useCallback(
    (
      recipientId: string,
      actorId: string,
      type: NotificationType,
      postId: string | null,
      existingNotifs: AppNotification[],
    ): AppNotification[] => {
      if (recipientId === actorId) return existingNotifs;
      const notif: AppNotification = {
        id: genId("notif"),
        recipientId,
        actorId,
        type,
        postId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      const next = [notif, ...existingNotifs];
      saveNotifications(next);
      return next;
    },
    [],
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

  // ---- Post status helper ----

  const resolveInitialStatus = useCallback(
    (authorId: string): PostStatus => {
      const role = roleOf(authorId);
      // Admin and mods are auto-approved
      if (role === "admin" || role === "mod") return "approved";
      // Users in the auto-approve list bypass moderation
      if (settings.autoApproveUserIds.includes(authorId)) return "approved";
      // When globalApproval is false (open board) every post is auto-approved
      if (!settings.globalApproval) return "approved";
      // Otherwise posts require moderation
      return "pending";
    },
    [roleOf, settings],
  );

  // ---- Post mutations ----

  const createPost = useCallback(
    (input: {
      body: string;
      mediaType: PostMediaType;
      mediaPayload: string | null;
    }): Post | null => {
      if (!currentUserId) return null;
      if (academy.isPaused(currentUserId)) return null;
      const safeBody = input.body.slice(0, 2000);
      if (!safeBody.trim()) return null;
      const status = resolveInitialStatus(currentUserId);
      const post: Post = {
        id: genId("post"),
        authorId: currentUserId,
        body: safeBody,
        mediaType: input.mediaType,
        mediaPayload: input.mediaPayload,
        status,
        pinned: false,
        createdAt: new Date().toISOString(),
        approvedBy: status === "approved" ? currentUserId : null,
        approvedAt: status === "approved" ? new Date().toISOString() : null,
        rejectedBy: null,
        rejectedAt: null,
      };
      setPosts((prev) => {
        const next = [post, ...prev];
        savePosts(next);
        return next;
      });
      // Notify all users who can approve when the post is pending
      if (status === "pending") {
        setNotifications((prev) => {
          let next = [...prev];
          const approvers = academy.users.filter(
            (u) => canApprovePosts(u.id) && u.id !== currentUserId,
          );
          for (const approver of approvers) {
            // pushNotification persists on each call; final iteration leaves
            // the complete list on disk.
            next = pushNotification(
              approver.id,
              currentUserId,
              "post_pending",
              post.id,
              next,
            );
          }
          return next;
        });
      }
      return post;
    },
    [currentUserId, academy, resolveInitialStatus, canApprovePosts, pushNotification],
  );

  const approvePost = useCallback(
    (postId: string) => {
      if (!canApprovePosts()) return;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const now = new Date().toISOString();
      setPosts((prev) => {
        const next = prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                status: "approved" as PostStatus,
                approvedBy: currentUserId,
                approvedAt: now,
                rejectedBy: null,
                rejectedAt: null,
              }
            : p,
        );
        savePosts(next);
        return next;
      });
      // Notify the post author
      setNotifications((prev) =>
        pushNotification(
          post.authorId,
          currentUserId,
          "post_approved",
          postId,
          prev,
        ),
      );
    },
    [canApprovePosts, posts, currentUserId, pushNotification],
  );

  const rejectPost = useCallback(
    (postId: string) => {
      if (!canApprovePosts()) return;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const now = new Date().toISOString();
      setPosts((prev) => {
        const next = prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                status: "rejected" as PostStatus,
                rejectedBy: currentUserId,
                rejectedAt: now,
                approvedBy: null,
                approvedAt: null,
              }
            : p,
        );
        savePosts(next);
        return next;
      });
      // Notify the post author
      setNotifications((prev) =>
        pushNotification(
          post.authorId,
          currentUserId,
          "post_rejected",
          postId,
          prev,
        ),
      );
    },
    [canApprovePosts, posts, currentUserId, pushNotification],
  );

  const deletePost = useCallback(
    (postId: string) => {
      if (!canDeletePost(postId)) return;
      setPosts((prev) => {
        const next = prev.filter((p) => p.id !== postId);
        savePosts(next);
        return next;
      });
      // Cascade: remove likes and comments on the deleted post
      setLikes((prev) => {
        const next = prev.filter((l) => l.postId !== postId);
        saveLikes(next);
        return next;
      });
      setComments((prev) => {
        const next = prev.filter((c) => c.postId !== postId);
        saveComments(next);
        return next;
      });
    },
    [canDeletePost],
  );

  const pinPost = useCallback(
    (postId: string) => {
      if (!canPinContent()) return;
      setPosts((prev) => {
        const next = prev.map((p) =>
          p.id === postId ? { ...p, pinned: true } : p,
        );
        savePosts(next);
        return next;
      });
    },
    [canPinContent],
  );

  const unpinPost = useCallback(
    (postId: string) => {
      if (!canPinContent()) return;
      setPosts((prev) => {
        const next = prev.map((p) =>
          p.id === postId ? { ...p, pinned: false } : p,
        );
        savePosts(next);
        return next;
      });
    },
    [canPinContent],
  );

  // ---- Like mutations ----

  const likePost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      if (academy.isPaused(currentUserId)) return;
      if (isLiked(postId)) return;
      const post = posts.find((p) => p.id === postId);
      setLikes((prev) => {
        const next = [...prev, { userId: currentUserId, postId }];
        saveLikes(next);
        return next;
      });
      // Notify post author; dedupe: skip if an unread 'like' from this actor already exists for this post
      if (post) {
        setNotifications((prev) => {
          const alreadyNotified = prev.some(
            (n) =>
              n.type === "like" &&
              n.actorId === currentUserId &&
              n.postId === postId &&
              !n.read,
          );
          if (alreadyNotified) return prev;
          return pushNotification(
            post.authorId,
            currentUserId,
            "like",
            postId,
            prev,
          );
        });
      }
    },
    [currentUserId, academy, isLiked, posts, pushNotification],
  );

  const unlikePost = useCallback(
    (postId: string) => {
      if (!currentUserId) return;
      setLikes((prev) => {
        const next = prev.filter(
          (l) => !(l.postId === postId && l.userId === currentUserId),
        );
        saveLikes(next);
        return next;
      });
    },
    [currentUserId],
  );

  // ---- Comment mutations ----

  const addComment = useCallback(
    (postId: string, body: string): Comment | null => {
      if (!currentUserId) return null;
      if (academy.isPaused(currentUserId)) return null;
      const targetPost = posts.find((p) => p.id === postId);
      if (!targetPost || targetPost.status !== "approved") return null;
      const trimmedBody = body.slice(0, 500);
      if (!trimmedBody.trim()) return null;
      const comment: Comment = {
        id: genId("comment"),
        postId,
        authorId: currentUserId,
        body: trimmedBody,
        pinned: false,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => {
        const next = [...prev, comment];
        saveComments(next);
        return next;
      });
      // Notify post author
      setNotifications((prev) => {
        return pushNotification(
          targetPost.authorId,
          currentUserId,
          "comment",
          postId,
          prev,
        );
      });
      return comment;
    },
    [currentUserId, academy, posts, pushNotification],
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      if (!canDeleteComment(commentId)) return;
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== commentId);
        saveComments(next);
        return next;
      });
    },
    [canDeleteComment],
  );

  const setPinComment = useCallback(
    (commentId: string, pinned: boolean) => {
      if (!canPinContent()) return;
      setComments((prev) => {
        const next = prev.map((c) =>
          c.id === commentId ? { ...c, pinned } : c,
        );
        saveComments(next);
        return next;
      });
    },
    [canPinContent],
  );

  const pinComment = useCallback(
    (commentId: string) => setPinComment(commentId, true),
    [setPinComment],
  );

  const unpinComment = useCallback(
    (commentId: string) => setPinComment(commentId, false),
    [setPinComment],
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
      if (isFollowing(userId)) return;
      setFollows((prev) => {
        const next = [
          ...prev,
          { followerId: currentUserId, followeeId: userId },
        ];
        saveFollows(next);
        return next;
      });
      // Notify the user being followed
      setNotifications((prev) => {
        return pushNotification(userId, currentUserId, "follow", null, prev);
      });
    },
    [currentUserId, isFollowing, pushNotification],
  );

  const unfollow = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      setFollows((prev) => {
        const next = prev.filter(
          (f) =>
            !(f.followerId === currentUserId && f.followeeId === userId),
        );
        saveFollows(next);
        return next;
      });
    },
    [currentUserId],
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
      if (!canManageApproval()) return;
      setSettingsState((prev) => {
        const next = { ...prev, globalApproval: value };
        saveCommunitySettings(next);
        return next;
      });
    },
    [canManageApproval],
  );

  const setAutoApprove = useCallback(
    (userId: string, enabled: boolean) => {
      if (!canManageApproval()) return;
      setSettingsState((prev) => {
        const ids = prev.autoApproveUserIds;
        const next = {
          ...prev,
          autoApproveUserIds: enabled
            ? ids.includes(userId)
              ? ids
              : [...ids, userId]
            : ids.filter((id) => id !== userId),
        };
        saveCommunitySettings(next);
        return next;
      });
    },
    [canManageApproval],
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
      if (roleOf(currentUserId) !== "admin") return;
      setModsState((prev) => {
        const next = {
          ...prev,
          [userId]: {
            canApprovePosts: false,
            canDeletePosts: false,
            canDeleteComments: false,
            canPinContent: false,
            canManageApproval: false,
          },
        };
        saveMods(next);
        return next;
      });
    },
    [currentUserId, roleOf],
  );

  const demoteMod = useCallback(
    (userId: string) => {
      if (roleOf(currentUserId) !== "admin") return;
      setModsState((prev) => {
        const next = { ...prev };
        delete next[userId];
        saveMods(next);
        return next;
      });
    },
    [currentUserId, roleOf],
  );

  const setModPermission = useCallback(
    (userId: string, key: keyof ModPermissions, value: boolean) => {
      if (roleOf(currentUserId) !== "admin") return;
      setModsState((prev) => {
        const existing = prev[userId];
        if (!existing) return prev;
        const next = {
          ...prev,
          [userId]: { ...existing, [key]: value },
        };
        saveMods(next);
        return next;
      });
    },
    [currentUserId, roleOf],
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
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        saveNotifications(next);
        return next;
      });
    },
    [],
  );

  const markAllNotificationsRead = useCallback(
    (userId?: string) => {
      const uid = userId ?? currentUserId;
      setNotifications((prev) => {
        const next = prev.map((n) =>
          n.recipientId === uid ? { ...n, read: true } : n,
        );
        saveNotifications(next);
        return next;
      });
    },
    [currentUserId],
  );

  // ---- Cascade purge ----

  const purgeUser = useCallback(
    (userId: string) => {
      // Compute deleted post IDs once from the current posts state so all
      // subsequent setters use the same consistent set (React batches state
      // updates, but each setter receives the latest prev for its own slice).
      const deletedPostIds = new Set(
        posts.filter((p) => p.authorId === userId).map((p) => p.id),
      );

      setPosts((prev) => {
        const next = prev.filter((p) => p.authorId !== userId);
        savePosts(next);
        return next;
      });
      setComments((prev) => {
        const next = prev.filter(
          (c) => c.authorId !== userId && !deletedPostIds.has(c.postId),
        );
        saveComments(next);
        return next;
      });
      setLikes((prev) => {
        const next = prev.filter(
          (l) => l.userId !== userId && !deletedPostIds.has(l.postId),
        );
        saveLikes(next);
        return next;
      });
      setFollows((prev) => {
        const next = prev.filter(
          (f) => f.followerId !== userId && f.followeeId !== userId,
        );
        saveFollows(next);
        return next;
      });
      setModsState((prev) => {
        const next = { ...prev };
        delete next[userId];
        saveMods(next);
        return next;
      });
      setSettingsState((prev) => {
        const next = {
          ...prev,
          autoApproveUserIds: prev.autoApproveUserIds.filter(
            (id) => id !== userId,
          ),
        };
        saveCommunitySettings(next);
        return next;
      });
      setNotifications((prev) => {
        const next = prev.filter(
          (n) => n.recipientId !== userId && n.actorId !== userId,
        );
        saveNotifications(next);
        return next;
      });
    },
    [posts],
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
      notificationsFor,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      purgeUser,
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
      notificationsFor,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      purgeUser,
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
