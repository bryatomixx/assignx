"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Module, ModuleProgress, Status, User, VideoProgress } from "@/lib/types";
import { MODULES, TOTAL_LESSONS } from "@/lib/mock/modules";
import {
  loadCurrentUserId,
  saveCurrentUserId,
  resetDemo as clearStorage,
} from "@/lib/store/storage";
import {
  fetchAcademyState,
  toggleComplete as apiToggleComplete,
  markComplete as apiMarkComplete,
  toggleHomework as apiToggleHomework,
  setHomeworkDone as apiSetHomeworkDone,
  recordVideoProgress as apiRecordVideoProgress,
  setStatus as apiSetStatus,
  unlockModule as apiUnlockModule,
  lockModule as apiLockModule,
  unlockAll as apiUnlockAll,
  lockAll as apiLockAll,
  removeUser as apiRemoveUser,
} from "@/lib/academy/api";
import { USER_CODES } from "@/lib/mock/users";

// ---------------------------------------------------------------------------
// Derived user builder
// ---------------------------------------------------------------------------

// Placeholder joinedAt for profiles that do not carry the field from the DB.
const PLACEHOLDER_JOINED = "2026-01-01";

// ---------------------------------------------------------------------------
// Context interface (unchanged from the localStorage version)
// ---------------------------------------------------------------------------

interface AcademyContextValue {
  ready: boolean;
  users: User[];
  currentUser: User | undefined;
  modules: Module[];
  // identity
  setCurrentUser: (id: string) => void;
  loginWithCode: (code: string) => User | null;
  // progress
  isComplete: (lessonId: string) => boolean;
  toggleComplete: (lessonId: string) => void;
  markComplete: (lessonId: string) => void;
  completedFor: (userId: string) => string[];
  moduleProgress: (moduleId: string, userId?: string) => ModuleProgress;
  overallPct: (userId?: string) => number;
  // homework
  isHomeworkDone: (lessonId: string, userId?: string) => boolean;
  toggleHomework: (lessonId: string) => void;
  setHomeworkDone: (userId: string, lessonId: string, done: boolean) => void;
  // access
  canAccess: (module: Module, userId?: string) => boolean;
  isPaused: (userId?: string) => boolean;
  // admin actions
  unlockModule: (userId: string, moduleId: string) => void;
  lockModule: (userId: string, moduleId: string) => void;
  unlockAll: (userId: string) => void;
  lockAll: (userId: string) => void;
  setStatus: (userId: string, status: Status) => void;
  removeUser: (userId: string) => void;
  // video progress ("furthest point watched" per clip)
  videoProgressFor: (userId: string, lessonId: string) => VideoProgress[];
  recordVideoProgress: (
    lessonId: string,
    clipIndex: number,
    elapsedSec: number,
    durationSec: number,
  ) => void;
  // demo
  resetDemo: () => void;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, string[]>>({});
  const [homeworkMap, setHomeworkMap] = useState<Record<string, string[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  // Keyed by "${userId}:${lessonId}:${clipIndex}"
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, VideoProgress>>({});

  // ---- Reverse map: code -> userId UUID (built from USER_CODES constant) ----
  // USER_CODES is Record<code, uuid> defined in lib/mock/users.ts
  // The reverse is used by loginWithCode to find the user object after the
  // users list is populated from the DB.

  // ---- Remote state loader ----

  const loadState = useCallback(async () => {
    try {
      const state = await fetchAcademyState();

      // Build the users list from profiles + moduleAccess
      const builtUsers: User[] = state.profiles.map((profile) => {
        // Derive unlocked module ids from the moduleAccess rows
        const unlockedModuleIds = state.moduleAccess
          .filter((ma) => ma.userId === profile.id)
          .map((ma) => ma.moduleId);

        // Find the code for this user from the mock code map (code -> uuid)
        const code =
          Object.entries(USER_CODES).find(([, uid]) => uid === profile.id)?.[0] ??
          undefined;

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          avatar: profile.avatar,
          unlockedModuleIds,
          joinedAt: PLACEHOLDER_JOINED,
          code,
        } satisfies User;
      });

      setUsers(builtUsers);

      // Build progress map: userId -> completedLessonIds[]
      const pm: Record<string, string[]> = {};
      for (const row of state.progress) {
        if (!pm[row.userId]) pm[row.userId] = [];
        pm[row.userId].push(row.lessonId);
      }
      setProgressMap(pm);

      // Build homework map: userId -> doneLessonIds[]
      const hw: Record<string, string[]> = {};
      for (const row of state.homework) {
        if (!hw[row.userId]) hw[row.userId] = [];
        hw[row.userId].push(row.lessonId);
      }
      setHomeworkMap(hw);

      // Build video progress map: key -> VideoProgress
      const vpm: Record<string, VideoProgress> = {};
      for (const row of state.videoProgress) {
        vpm[`${row.userId}:${row.lessonId}:${row.clipIndex}`] = {
          userId: row.userId,
          lessonId: row.lessonId,
          clipIndex: row.clipIndex,
          elapsedSec: row.elapsedSec,
          durationSec: row.durationSec,
        };
      }
      setVideoProgressMap(vpm);
    } catch {
      // Keep whatever state is already in memory so the UI does not go blank.
    } finally {
      setReady(true);
    }
  }, []);

  // Hydrate from the server API on mount. Session (currentUserId) still comes
  // from localStorage (mock auth, unchanged).
  useEffect(() => {
    setCurrentUserId(loadCurrentUserId());
    void loadState();
  }, [loadState]);

  // ---- Identity (mock auth, localStorage only) ----

  const setCurrentUser = useCallback((id: string) => {
    setCurrentUserId(id);
    saveCurrentUserId(id);
  }, []);

  const loginWithCode = useCallback(
    (code: string): User | null => {
      const trimmed = code.trim();
      // Try USER_CODES map first (code -> UUID)
      const uuidFromMap = USER_CODES[trimmed];
      if (uuidFromMap) {
        const match = users.find((u) => u.id === uuidFromMap);
        if (match) {
          setCurrentUser(match.id);
          return match;
        }
      }
      // Fallback: scan users list (handles codes that are in DB but not in the
      // static map -- rare, but keeps the UI from breaking).
      const match = users.find((u) => u.code === trimmed);
      if (match) {
        setCurrentUser(match.id);
        return match;
      }
      return null;
    },
    [users, setCurrentUser],
  );

  // ---- Progress getters ----

  const completedFor = useCallback(
    (userId: string) => progressMap[userId] ?? [],
    [progressMap],
  );

  const isComplete = useCallback(
    (lessonId: string) => (progressMap[currentUserId] ?? []).includes(lessonId),
    [progressMap, currentUserId],
  );

  const moduleProgress = useCallback(
    (moduleId: string, userId?: string): ModuleProgress => {
      const uid = userId ?? currentUserId;
      const module = MODULES.find((m) => m.id === moduleId);
      const total = module?.lessons.length ?? 0;
      const done = completedFor(uid);
      const completed =
        module?.lessons.filter((l) => done.includes(l.id)).length ?? 0;
      return {
        moduleId,
        total,
        completed,
        pct: total ? Math.round((completed / total) * 100) : 0,
      };
    },
    [currentUserId, completedFor],
  );

  const overallPct = useCallback(
    (userId?: string): number => {
      const uid = userId ?? currentUserId;
      const done = completedFor(uid).length;
      return TOTAL_LESSONS ? Math.round((done / TOTAL_LESSONS) * 100) : 0;
    },
    [currentUserId, completedFor],
  );

  // ---- Progress mutations (API + refetch) ----

  const toggleComplete = useCallback(
    (lessonId: string) => {
      if (!currentUserId) return;
      void apiToggleComplete(currentUserId, lessonId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const markComplete = useCallback(
    (lessonId: string) => {
      if (!currentUserId) return;
      void apiMarkComplete(currentUserId, lessonId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Homework getters ----

  const isHomeworkDone = useCallback(
    (lessonId: string, userId?: string) =>
      (homeworkMap[userId ?? currentUserId] ?? []).includes(lessonId),
    [homeworkMap, currentUserId],
  );

  // ---- Homework mutations (API + refetch) ----

  const toggleHomework = useCallback(
    (lessonId: string) => {
      if (!currentUserId) return;
      void apiToggleHomework(currentUserId, lessonId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const setHomeworkDone = useCallback(
    (userId: string, lessonId: string, done: boolean) => {
      if (!currentUserId) return;
      void apiSetHomeworkDone(currentUserId, userId, lessonId, done).then(() =>
        loadState(),
      );
    },
    [currentUserId, loadState],
  );

  // ---- Access getters ----

  const canAccess = useCallback(
    (module: Module, userId?: string): boolean => {
      if (module.access === "free") return true;
      const user = users.find((u) => u.id === (userId ?? currentUserId));
      return !!user?.unlockedModuleIds.includes(module.id);
    },
    [users, currentUserId],
  );

  const isPaused = useCallback(
    (userId?: string): boolean => {
      const user = users.find((u) => u.id === (userId ?? currentUserId));
      return user?.status === "paused";
    },
    [users, currentUserId],
  );

  // ---- Admin mutations (API + refetch) ----

  const unlockModule = useCallback(
    (userId: string, moduleId: string) => {
      if (!currentUserId) return;
      void apiUnlockModule(currentUserId, userId, moduleId).then(() =>
        loadState(),
      );
    },
    [currentUserId, loadState],
  );

  const lockModule = useCallback(
    (userId: string, moduleId: string) => {
      if (!currentUserId) return;
      void apiLockModule(currentUserId, userId, moduleId).then(() =>
        loadState(),
      );
    },
    [currentUserId, loadState],
  );

  const unlockAll = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiUnlockAll(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const lockAll = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiLockAll(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const setStatus = useCallback(
    (userId: string, status: Status) => {
      if (!currentUserId) return;
      void apiSetStatus(currentUserId, userId, status).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  const removeUser = useCallback(
    (userId: string) => {
      if (!currentUserId) return;
      void apiRemoveUser(currentUserId, userId).then(() => loadState());
    },
    [currentUserId, loadState],
  );

  // ---- Video progress ----
  // recordVideoProgress is called every second during playback. To avoid
  // chatty network traffic and state flicker:
  //   1. Update the local videoProgressMap optimistically (only if elapsed advances).
  //   2. Persist to the API in fire-and-forget (no await, no refetch).

  const recordVideoProgress = useCallback(
    (
      lessonId: string,
      clipIndex: number,
      elapsedSec: number,
      durationSec: number,
    ) => {
      if (!currentUserId) return;
      const key = `${currentUserId}:${lessonId}:${clipIndex}`;
      setVideoProgressMap((prev) => {
        const existing = prev[key];
        // Only advance; never let elapsed go backwards.
        if (existing && existing.elapsedSec >= elapsedSec) return prev;
        const entry: VideoProgress = {
          userId: currentUserId,
          lessonId,
          clipIndex,
          elapsedSec,
          durationSec,
        };
        return { ...prev, [key]: entry };
      });
      // Fire-and-forget: persist the new maximum without blocking or refetching.
      void apiRecordVideoProgress(
        currentUserId,
        lessonId,
        clipIndex,
        elapsedSec,
        durationSec,
      );
    },
    [currentUserId],
  );

  const videoProgressFor = useCallback(
    (userId: string, lessonId: string): VideoProgress[] =>
      Object.values(videoProgressMap).filter(
        (vp) => vp.userId === userId && vp.lessonId === lessonId,
      ),
    [videoProgressMap],
  );

  // ---- currentUser derived from users + currentUserId ----

  const currentUser = useMemo<User | undefined>(
    () => users.find((u) => u.id === currentUserId) ?? users[0],
    [users, currentUserId],
  );

  // ---- Demo reset: only clears local session; DB state is untouched ----

  const resetDemo = useCallback(() => {
    clearStorage();
    window.location.reload();
  }, []);

  // ---- Context value ----

  const value = useMemo<AcademyContextValue>(
    () => ({
      ready,
      users,
      currentUser,
      modules: MODULES,
      setCurrentUser,
      loginWithCode,
      isComplete,
      toggleComplete,
      markComplete,
      completedFor,
      moduleProgress,
      overallPct,
      isHomeworkDone,
      toggleHomework,
      setHomeworkDone,
      canAccess,
      isPaused,
      unlockModule,
      lockModule,
      unlockAll,
      lockAll,
      setStatus,
      removeUser,
      videoProgressFor,
      recordVideoProgress,
      resetDemo,
    }),
    [
      ready,
      users,
      currentUser,
      setCurrentUser,
      loginWithCode,
      isComplete,
      toggleComplete,
      markComplete,
      completedFor,
      moduleProgress,
      overallPct,
      isHomeworkDone,
      toggleHomework,
      setHomeworkDone,
      canAccess,
      isPaused,
      unlockModule,
      lockModule,
      unlockAll,
      lockAll,
      setStatus,
      removeUser,
      videoProgressFor,
      recordVideoProgress,
      resetDemo,
    ],
  );

  return (
    <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>
  );
}

export function useAcademy(): AcademyContextValue {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("useAcademy must be used within AcademyProvider");
  return ctx;
}
