import type { User, Progress, HomeworkRecord } from "@/lib/types";

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

/** Seed progress so the admin view shows real data on first load. */
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

/** Seed homework so the admin can see done vs pending. */
export const SEED_HOMEWORK: HomeworkRecord[] = [
  { userId: "33333333-3333-3333-3333-333333333333", doneLessonIds: ["orientation", "w1d1"] },
  {
    userId: "44444444-4444-4444-4444-444444444444",
    doneLessonIds: ["orientation", "w1d1", "w1d2", "w2d1", "w2d2"],
  },
];

export const DEFAULT_USER_ID = "22222222-2222-2222-2222-222222222222";
