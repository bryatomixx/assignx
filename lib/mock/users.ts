/**
 * lib/mock/users.ts
 *
 * Mock auth layer. The live user/progress/homework/video state now lives in
 * Supabase and is fetched via lib/academy/api.ts. This file keeps only:
 *   - USER_CODES: the static code -> UUID map for mock login.
 *   - DEFAULT_USER_ID: the UUID used when localStorage has no session.
 *   - SEED_* exports retained so lib/store/storage.ts continues to compile
 *     (storage.ts is still used for community/board and session keys).
 */

import type { User, Progress, HomeworkRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock login codes  (code -> UUID, matches the rows seeded in Supabase)
// ---------------------------------------------------------------------------

export const USER_CODES: Record<string, string> = {
  "9999": "11111111-1111-1111-1111-111111111111", // Noah Nega (admin)
  "1234": "22222222-2222-2222-2222-222222222222", // Test Member (student)
};

export const DEFAULT_USER_ID = "22222222-2222-2222-2222-222222222222";

// ---------------------------------------------------------------------------
// Legacy seed data -- kept only so lib/store/storage.ts can import them
// without a compile error. AcademyProvider no longer uses these; the real
// state comes from the DB. Storage.ts still uses them as LocalStorage
// fallbacks for the loadUsers/loadProgress/loadHomework functions, which are
// no longer called by AcademyProvider but remain exported for backward compat.
// ---------------------------------------------------------------------------

export const SEED_USERS: User[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Noah Nega",
    email: "noah@assignx.ai",
    role: "admin",
    status: "active",
    unlockedModuleIds: ["mod-scale", "mod-voice", "mod-enterprise"],
    avatar: "🧑🏻‍💼",
    joinedAt: "2026-01-12",
    code: "9999",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Test Member",
    email: "test@partner.io",
    role: "student",
    status: "active",
    unlockedModuleIds: [],
    avatar: "🧑🏻‍💻",
    joinedAt: "2026-06-01",
    code: "1234",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Jon S.",
    email: "jon@partner.io",
    role: "student",
    status: "active",
    unlockedModuleIds: [],
    avatar: "🧔🏻",
    joinedAt: "2026-05-02",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Michelle N.",
    email: "michelle@partner.io",
    role: "student",
    status: "active",
    unlockedModuleIds: ["mod-scale"],
    avatar: "👩🏽‍🦱",
    joinedAt: "2026-04-18",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Stevie F.",
    email: "stevie@partner.io",
    role: "student",
    status: "paused",
    unlockedModuleIds: [],
    avatar: "👨🏼‍🦰",
    joinedAt: "2026-05-20",
  },
];

export const SEED_PROGRESS: Progress[] = [
  { userId: "11111111-1111-1111-1111-111111111111", completedLessonIds: [] },
  { userId: "22222222-2222-2222-2222-222222222222", completedLessonIds: [] },
  {
    userId: "33333333-3333-3333-3333-333333333333",
    completedLessonIds: ["orientation", "w1d1", "w1d2"],
  },
  {
    userId: "44444444-4444-4444-4444-444444444444",
    completedLessonIds: [
      "orientation",
      "w1d1",
      "w1d2",
      "w2d1",
      "w2d2",
      "w3d1",
      "w3d2",
      "agency-scaling-l1",
    ],
  },
  {
    userId: "55555555-5555-5555-5555-555555555555",
    completedLessonIds: ["orientation"],
  },
];

export const SEED_HOMEWORK: HomeworkRecord[] = [
  { userId: "33333333-3333-3333-3333-333333333333", doneLessonIds: ["orientation", "w1d1"] },
  {
    userId: "44444444-4444-4444-4444-444444444444",
    doneLessonIds: ["orientation", "w1d1", "w1d2", "w2d1", "w2d2"],
  },
];
