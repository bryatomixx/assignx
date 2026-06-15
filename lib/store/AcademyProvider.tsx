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
  loadHomework,
  loadProgress,
  loadUsers,
  loadVideoProgress,
  resetDemo as clearStorage,
  saveCurrentUserId,
  saveHomework,
  saveProgress,
  saveUsers,
  saveVideoProgress,
} from "@/lib/store/storage";

const PAID_MODULE_IDS = MODULES.filter((m) => m.access === "paid").map(
  (m) => m.id,
);

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

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, string[]>>({});
  const [homeworkMap, setHomeworkMap] = useState<Record<string, string[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  // Keyed by "${userId}:${lessonId}:${clipIndex}"
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, VideoProgress>>({});

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    setUsers(loadUsers());
    const pm: Record<string, string[]> = {};
    for (const row of loadProgress()) pm[row.userId] = row.completedLessonIds;
    setProgressMap(pm);
    const hw: Record<string, string[]> = {};
    for (const row of loadHomework()) hw[row.userId] = row.doneLessonIds;
    setHomeworkMap(hw);
    const vpm: Record<string, VideoProgress> = {};
    for (const row of loadVideoProgress()) {
      vpm[`${row.userId}:${row.lessonId}:${row.clipIndex}`] = row;
    }
    setVideoProgressMap(vpm);
    setCurrentUserId(loadCurrentUserId());
    setReady(true);
  }, []);

  const persistProgress = useCallback((map: Record<string, string[]>) => {
    saveProgress(
      Object.entries(map).map(([userId, completedLessonIds]) => ({
        userId,
        completedLessonIds,
      })),
    );
  }, []);

  const persistHomework = useCallback((map: Record<string, string[]>) => {
    saveHomework(
      Object.entries(map).map(([userId, doneLessonIds]) => ({
        userId,
        doneLessonIds,
      })),
    );
  }, []);

  const setCurrentUser = useCallback((id: string) => {
    setCurrentUserId(id);
    saveCurrentUserId(id);
  }, []);

  const loginWithCode = useCallback(
    (code: string): User | null => {
      const match = users.find((u) => u.code && u.code === code.trim());
      if (match) {
        setCurrentUser(match.id);
        return match;
      }
      return null;
    },
    [users, setCurrentUser],
  );

  // ---- progress ----
  const completedFor = useCallback(
    (userId: string) => progressMap[userId] ?? [],
    [progressMap],
  );

  const isComplete = useCallback(
    (lessonId: string) => (progressMap[currentUserId] ?? []).includes(lessonId),
    [progressMap, currentUserId],
  );

  const toggleComplete = useCallback(
    (lessonId: string) => {
      setProgressMap((prev) => {
        const cur = prev[currentUserId] ?? [];
        const next = cur.includes(lessonId)
          ? cur.filter((id) => id !== lessonId)
          : [...cur, lessonId];
        const updated = { ...prev, [currentUserId]: next };
        persistProgress(updated);
        return updated;
      });
    },
    [currentUserId, persistProgress],
  );

  // Idempotent: ensure a lesson is in the completed list (used by auto-complete
  // when all of a lesson's clips have been watched). Never un-completes.
  const markComplete = useCallback(
    (lessonId: string) => {
      setProgressMap((prev) => {
        const cur = prev[currentUserId] ?? [];
        if (cur.includes(lessonId)) return prev; // already complete -> no change
        const updated = { ...prev, [currentUserId]: [...cur, lessonId] };
        persistProgress(updated);
        return updated;
      });
    },
    [currentUserId, persistProgress],
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

  // ---- homework ----
  const isHomeworkDone = useCallback(
    (lessonId: string, userId?: string) =>
      (homeworkMap[userId ?? currentUserId] ?? []).includes(lessonId),
    [homeworkMap, currentUserId],
  );

  const setHomeworkDone = useCallback(
    (userId: string, lessonId: string, done: boolean) => {
      setHomeworkMap((prev) => {
        const cur = prev[userId] ?? [];
        const next = done
          ? cur.includes(lessonId)
            ? cur
            : [...cur, lessonId]
          : cur.filter((id) => id !== lessonId);
        const updated = { ...prev, [userId]: next };
        persistHomework(updated);
        return updated;
      });
    },
    [persistHomework],
  );

  const toggleHomework = useCallback(
    (lessonId: string) => {
      setHomeworkDone(currentUserId, lessonId, !isHomeworkDone(lessonId));
    },
    [currentUserId, isHomeworkDone, setHomeworkDone],
  );

  // ---- access ----
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

  // ---- admin user mutations ----
  const updateUser = useCallback(
    (userId: string, patch: (u: User) => User) => {
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === userId ? patch(u) : u));
        saveUsers(next);
        return next;
      });
    },
    [],
  );

  const unlockModule = useCallback(
    (userId: string, moduleId: string) =>
      updateUser(userId, (u) => ({
        ...u,
        unlockedModuleIds: u.unlockedModuleIds.includes(moduleId)
          ? u.unlockedModuleIds
          : [...u.unlockedModuleIds, moduleId],
      })),
    [updateUser],
  );

  const lockModule = useCallback(
    (userId: string, moduleId: string) =>
      updateUser(userId, (u) => ({
        ...u,
        unlockedModuleIds: u.unlockedModuleIds.filter((id) => id !== moduleId),
      })),
    [updateUser],
  );

  const unlockAll = useCallback(
    (userId: string) =>
      updateUser(userId, (u) => ({ ...u, unlockedModuleIds: [...PAID_MODULE_IDS] })),
    [updateUser],
  );

  const lockAll = useCallback(
    (userId: string) =>
      updateUser(userId, (u) => ({ ...u, unlockedModuleIds: [] })),
    [updateUser],
  );

  const setStatus = useCallback(
    (userId: string, status: Status) =>
      updateUser(userId, (u) => ({ ...u, status })),
    [updateUser],
  );

  const removeUser = useCallback(
    (userId: string) => {
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        saveUsers(next);
        return next;
      });
    },
    [],
  );

  // ---- video progress ----

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
        // Only advance; never let elapsed go backwards
        if (existing && existing.elapsedSec >= elapsedSec) return prev;
        const entry: VideoProgress = {
          userId: currentUserId,
          lessonId,
          clipIndex,
          elapsedSec,
          durationSec,
        };
        const next = { ...prev, [key]: entry };
        saveVideoProgress(Object.values(next));
        return next;
      });
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

  const currentUser = useMemo<User | undefined>(
    () => users.find((u) => u.id === currentUserId) ?? users[0],
    [users, currentUserId],
  );

  const resetDemo = useCallback(() => {
    clearStorage();
    window.location.reload();
  }, []);

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
