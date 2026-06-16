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
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Placeholder for profiles that do not carry joinedAt from the DB.
// ---------------------------------------------------------------------------

const PLACEHOLDER_JOINED = "2026-01-01";

// ---------------------------------------------------------------------------
// Auth result type returned by signUp/signIn/signOut.
// ---------------------------------------------------------------------------

export interface AuthResult {
  error?: string;
  user?: User;
}

// ---------------------------------------------------------------------------
// Context interface
// ---------------------------------------------------------------------------

interface AcademyContextValue {
  ready: boolean;
  authLoading: boolean;
  users: User[];
  currentUser: User | undefined;
  modules: Module[];
  // auth (real)
  signUp: (args: { name: string; email: string; password: string }) => Promise<AuthResult>;
  signIn: (args: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  // auth (deprecated stubs -- kept for backward compat with existing UI components;
  //        the frontend-dev must replace calls to these with signIn/signOut)
  /** @deprecated Use signIn() instead. Will be removed once login page is updated. */
  loginWithCode: (code: string) => User | null;
  /** @deprecated User-switching is not supported with real auth. No-op. */
  setCurrentUser: (id: string) => void;
  /** @deprecated Use signOut() instead. */
  resetDemo: () => void;
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
  // video progress
  videoProgressFor: (userId: string, lessonId: string) => VideoProgress[];
  recordVideoProgress: (
    lessonId: string,
    clipIndex: number,
    elapsedSec: number,
    durationSec: number,
  ) => void;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

// ---------------------------------------------------------------------------
// Error message mapper
// ---------------------------------------------------------------------------

function mapAuthError(message: string): string {
  const lc = message.toLowerCase();
  if (lc.includes("invalid login") || lc.includes("invalid credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (lc.includes("email not confirmed")) {
    return "Your email is not confirmed yet. Please contact your administrator.";
  }
  if (lc.includes("user already registered") || lc.includes("already been registered") || lc.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (lc.includes("password should be") || lc.includes("weak password") || lc.includes("at least 6")) {
    return "Password must be at least 6 characters.";
  }
  if (lc.includes("rate limit") || lc.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

  // Academy data state
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, string[]>>({});
  const [homeworkMap, setHomeworkMap] = useState<Record<string, string[]>>({});
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, VideoProgress>>({});

  // ---- Auth initialization ----

  useEffect(() => {
    const sb = getSupabaseBrowserClient();

    // Load session on mount.
    void sb.auth.getUser().then(
      (result: { data: { user: SupabaseUser | null }; error: unknown }) => {
        setSupabaseUser(result.data.user ?? null);
        setAuthLoading(false);
      },
      () => {
        // Network/Supabase failure: assume not authenticated so the UI does not
        // hang on an infinite loading spinner.
        setSupabaseUser(null);
        setAuthLoading(false);
      },
    );

    // Subscribe to auth state changes (sign in, sign out, token refresh).
    const { data: listener } = sb.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSupabaseUser(session?.user ?? null);
        setAuthLoading(false);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ---- Remote academy state loader ----

  const loadState = useCallback(async (): Promise<User[]> => {
    try {
      const state = await fetchAcademyState();

      const builtUsers: User[] = state.profiles.map((profile) => {
        const unlockedModuleIds = state.moduleAccess
          .filter((ma) => ma.userId === profile.id)
          .map((ma) => ma.moduleId);

        return {
          id: profile.id,
          name: profile.name,
          // email is null for other users' profiles (non-admin viewers).
          email: profile.email ?? "",
          role: profile.role,
          status: profile.status,
          avatar: profile.avatar,
          unlockedModuleIds,
          // Use the real join date when present; fall back to the placeholder.
          joinedAt: profile.joinedAt ?? PLACEHOLDER_JOINED,
          bio: profile.bio ?? undefined,
        } satisfies User;
      });

      setUsers(builtUsers);

      const pm: Record<string, string[]> = {};
      for (const row of state.progress) {
        if (!pm[row.userId]) pm[row.userId] = [];
        pm[row.userId].push(row.lessonId);
      }
      setProgressMap(pm);

      const hw: Record<string, string[]> = {};
      for (const row of state.homework) {
        if (!hw[row.userId]) hw[row.userId] = [];
        hw[row.userId].push(row.lessonId);
      }
      setHomeworkMap(hw);

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
      setReady(true);
      return builtUsers;
    } catch {
      // Keep whatever state is already in memory so the UI does not go blank.
      setReady(true);
      return [];
    }
  }, []);

  // Load academy state only when there is a real session. On public pages
  // (the marketing landing) a logged out visitor has no session, so calling
  // the authenticated /api/academy/state would 401 for nothing. Mark ready so
  // the auth guard can resolve to "logged out" without a failed request.
  useEffect(() => {
    if (authLoading) return;
    if (!supabaseUser) {
      setReady(true);
      return;
    }
    void loadState();
  }, [authLoading, supabaseUser, loadState]);

  // ---- Auth actions ----

  const signUp = useCallback(
    async (args: { name: string; email: string; password: string }): Promise<AuthResult> => {
      const sb = getSupabaseBrowserClient();
      const { data, error } = await sb.auth.signUp({
        email: args.email,
        password: args.password,
        options: {
          // handle_new_user trigger reads raw_user_meta_data->>'name' to populate profiles.name.
          data: { name: args.name },
        },
      });
      if (error) {
        return { error: mapAuthError(error.message) };
      }
      // Reload academy state to include the new profile row created by the trigger.
      // Resolve the signed-up user (incl. role) from the freshly loaded list so
      // the caller can redirect without reading stale React state.
      const builtUsers = await loadState();
      const uid = data.user?.id;
      const user = uid ? builtUsers.find((u) => u.id === uid) : undefined;
      return { user };
    },
    [loadState],
  );

  const signIn = useCallback(
    async (args: { email: string; password: string }): Promise<AuthResult> => {
      const sb = getSupabaseBrowserClient();
      const { data, error } = await sb.auth.signInWithPassword({
        email: args.email,
        password: args.password,
      });
      if (error) {
        return { error: mapAuthError(error.message) };
      }
      // Load academy state once and resolve the signed-in user (incl. role) from
      // the freshly loaded list so the caller can redirect without reading stale
      // React state. onAuthStateChange handles the normal lifecycle separately.
      const builtUsers = await loadState();
      const uid = data.user?.id;
      const user = uid ? builtUsers.find((u) => u.id === uid) : undefined;
      return { user };
    },
    [loadState],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.auth.signOut();
    if (error) {
      return { error: mapAuthError(error.message) };
    }
    return {};
  }, []);

  // ---- Deprecated stub callbacks (kept for backward compat until UI is updated) ----

  // loginWithCode: the login page currently calls this. It is a no-op under real auth.
  // The frontend-dev must replace it with a real email/password form using signIn().
  const loginWithCode = useCallback(
    (...args: [string]): User | null => {
      void args;
      console.warn(
        "[AcademyProvider] loginWithCode() is deprecated. Use signIn() with email/password.",
      );
      return null;
    },
    [],
  );

  // setCurrentUser: user-switching was a demo-only feature. No-op under real auth.
  const setCurrentUser = useCallback((...args: [string]): void => {
    void args;
    console.warn(
      "[AcademyProvider] setCurrentUser() is deprecated. Use signIn() to authenticate.",
    );
  }, []);

  // resetDemo: was used to clear localStorage session. Now delegates to signOut().
  const resetDemo = useCallback((): void => {
    void signOut();
  }, [signOut]);

  // ---- currentUserId derived from real session ----

  const currentUserId = supabaseUser?.id ?? "";

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
      const mod = MODULES.find((m) => m.id === moduleId);
      const total = mod?.lessons.length ?? 0;
      const done = completedFor(uid);
      const completed =
        mod?.lessons.filter((l) => done.includes(l.id)).length ?? 0;
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

  // ---- Progress mutations ----

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

  // ---- Homework mutations ----

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

  // ---- Admin mutations ----

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

  // ---- currentUser derived from users list + real session uid ----

  const currentUser = useMemo<User | undefined>(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId],
  );

  // ---- Context value ----

  const value = useMemo<AcademyContextValue>(
    () => ({
      ready,
      authLoading,
      users,
      currentUser,
      modules: MODULES,
      signUp,
      signIn,
      signOut,
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
      // deprecated stubs
      loginWithCode,
      setCurrentUser,
      resetDemo,
    }),
    [
      ready,
      authLoading,
      users,
      currentUser,
      signUp,
      signIn,
      signOut,
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
      loginWithCode,
      setCurrentUser,
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
