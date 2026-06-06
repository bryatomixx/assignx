import type { User, Progress, HomeworkRecord } from "@/lib/types";

export const SEED_USERS: User[] = [
  {
    id: "u-admin",
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
    id: "u-test",
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
    id: "u-jon",
    name: "Jon S.",
    email: "jon@partner.io",
    role: "student",
    status: "active",
    unlockedModuleIds: [],
    avatar: "🧔🏻",
    joinedAt: "2026-05-02",
  },
  {
    id: "u-michelle",
    name: "Michelle N.",
    email: "michelle@partner.io",
    role: "student",
    status: "active",
    unlockedModuleIds: ["mod-scale"],
    avatar: "👩🏽‍🦱",
    joinedAt: "2026-04-18",
  },
  {
    id: "u-stevie",
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
  { userId: "u-admin", completedLessonIds: [] },
  { userId: "u-test", completedLessonIds: [] },
  {
    userId: "u-jon",
    completedLessonIds: ["orientation", "w1d1", "w1d2"],
  },
  {
    userId: "u-michelle",
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
    userId: "u-stevie",
    completedLessonIds: ["orientation"],
  },
];

/** Seed homework so the admin can see done vs pending. */
export const SEED_HOMEWORK: HomeworkRecord[] = [
  { userId: "u-jon", doneLessonIds: ["orientation", "w1d1"] },
  {
    userId: "u-michelle",
    doneLessonIds: ["orientation", "w1d1", "w1d2", "w2d1", "w2d2"],
  },
];

export const DEFAULT_USER_ID = "u-test";
