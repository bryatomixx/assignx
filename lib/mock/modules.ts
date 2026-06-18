import { Compass, Rocket, Phone, TrendingUp, Plug } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Module, Lesson, Clip } from "@/lib/types";
import { parseVideo } from "@/lib/video";

/**
 * Course curriculum: five modules (Orientation + Week 1-4), each a dropdown in
 * the left ModuleNav that expands to its lessons. A lesson is the leaf unit:
 * a single teaching video (YouTube or Loom) OR a "text" lesson (no player).
 */

interface LessonOpts {
  durationMin?: number;
  /** YouTube or Loom share/watch URL. */
  video?: string;
  /** Mark a lesson as text-only ("not a video"). */
  kind?: "text";
  content?: string;
}

/** Compact lesson builder. */
const L = (id: string, title: string, opts: LessonOpts = {}): Lesson => ({
  id,
  title,
  durationMin: opts.durationMin ?? 8,
  ...(opts.kind ? { kind: opts.kind } : {}),
  ...(opts.video ? { video: opts.video } : {}),
  ...(opts.content ? { content: opts.content } : {}),
  resources: [],
});

const mod = (
  id: string,
  slug: string,
  title: string,
  description: string,
  order: number,
  Icon: LucideIcon,
  accent: string,
  lessons: Lesson[],
): Module => ({
  id,
  slug,
  title,
  description,
  order,
  access: "free",
  Icon,
  accent,
  lessons,
});

const ORIENTATION = mod(
  "mod-orientation",
  "orientation",
  "Orientation",
  "Get oriented: the AssignX model, your vision, and what you'll actually build.",
  1,
  Compass,
  "linear-gradient(135deg,#7802DF,#FF0BD6)",
  [
    L(
      "agency-partner-30day",
      "Agency Partner: 30-Day AI Agency Launch Challenge",
      {
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // TODO: real lesson video
        durationMin: 6,
        content:
          "Your 30-day path from setup to launch. What you'll build, the milestones each week, and how to win the challenge.",
      },
    ),
    L("mission-and-vision", "AssignX - Mission and Vision", { durationMin: 8 }),
    L(
      "inside-ai-aaas-model",
      "Inside the AI AaaS Model (What you ACTUALLY DO)",
      { durationMin: 12 },
    ),
    L("build-enterprise-value", "How to Build Enterprise Value With AI", {
      durationMin: 10,
    }),
    L("os-x-operating-system", "OS-X: The AI Operating System for Sales", {
      durationMin: 9,
    }),
  ],
);

const WEEK_1 = mod(
  "mod-week-1",
  "week-1-getting-started",
  "Week 1 - Getting Started",
  "Stand up your agency: account, platform, niche, branding, and integrations.",
  2,
  Rocket,
  "linear-gradient(135deg,#7802DF,#5B0EFF)",
  [
    L("creating-agency-account", "Creating Your Agency Account", {
      durationMin: 7,
    }),
    L("agency-platform-walkthrough", "Agency Platform Walkthrough", {
      video: "https://www.loom.com/share/85b96828e69b42fcaf45e5ec2c09c77a", // TODO: real lesson video
      durationMin: 15,
      content:
        "A guided tour of the agency platform: pipelines, campaigns, smartlists, and KYC.",
    }),
    L("choose-perfect-niche", "Choose The Perfect Niche (Step by Step)", {
      kind: "text",
      durationMin: 10,
      content:
        "A written, step-by-step framework to pick your one official ICP. Work through it and lock your niche.",
    }),
    L(
      "name-brand-agency",
      "How to Name & Brand Your AI Agency (Use Prompt)",
      {
        kind: "text",
        durationMin: 8,
        content:
          "Use the included prompt to generate names, taglines, and a brand direction for your agency.",
      },
    ),
    L("stripe-setup-walkthrough", "Stripe Setup Walkthrough", {
      durationMin: 9,
    }),
    L("twilio-integration", "Twilio Integration", { durationMin: 11 }),
    L("twilio-trust-hub", "Twilio Trust Hub Explained", { durationMin: 8 }),
    L("twilio-customer-profile", "Twilio - Customer Profile", {
      durationMin: 7,
    }),
  ],
);

const WEEK_2 = mod(
  "mod-week-2",
  "week-2-launching",
  "Week 2 - Launching",
  "Launch your AI: build agents, master prompts, calls, pipelines, and lead scoring.",
  3,
  Phone,
  "linear-gradient(135deg,#430596,#FF0BD6)",
  [
    L("live-session-master-prompt", "Live Session + Master Prompt", {
      durationMin: 20,
    }),
    L("building-an-agent", "Building an Agent (Step by Step)", {
      durationMin: 16,
    }),
    L("prompt-sales-agents", "Prompt AI Sales Agents Like a Pro", {
      durationMin: 14,
    }),
    L("getting-started", "Getting Started", { durationMin: 6 }),
    L("know-your-customers-kyc", "Know Your Customers (KYC)", {
      durationMin: 8,
    }),
    L("call-script-prompting", "Call Script + Prompting", { durationMin: 12 }),
    L("starting-calls", "Starting Calls (Step by Step)", { durationMin: 10 }),
    L("crm-pipeline-stages", "CRM + Pipeline Stages", { durationMin: 9 }),
    L("pausing-resuming-calls", "Pausing & Resuming Calls", { durationMin: 5 }),
    L("using-lead-enrichment", "Using Lead Enrichment", { durationMin: 7 }),
    L("setup-stages-for-ai", "Setup your stages for your AI", {
      durationMin: 8,
    }),
    L("lead-scoring", "Lead Scoring: How Your AI Qualifies Leads", {
      durationMin: 9,
    }),
    L("custom-pipeline-stages", "Custom Pipeline & Stages", { durationMin: 8 }),
  ],
);

const WEEK_3 = mod(
  "mod-week-3",
  "week-3-sales-marketing",
  "Week 3 - Sales and Marketing",
  "Sell and market: growth engine, lead sources, live workshop, and sales decks.",
  4,
  TrendingUp,
  "linear-gradient(135deg,#7802DF,#300FFF)",
  [
    L(
      "build-ai-growth-engine",
      "Build AI Growth Engine - Pipeline + Agents + Emails",
      { durationMin: 22 },
    ),
    L("21-lead-sources", "21 Lead Sources To Find Clients", {
      durationMin: 13,
    }),
    L(
      "live-ai-workshop",
      "Live AI Workshop (2 Facebook leads to Xbar Closed)",
      { durationMin: 35 },
    ),
    L("demo-launch-client-agents", "How to Demo and Launch Client Agents", {
      durationMin: 12,
    }),
    L("dental-office-sales-deck", "Dental Office Sales Deck", {
      kind: "text",
      durationMin: 6,
    }),
    L("law-office-sales-deck", "Law Office Sales Deck", {
      kind: "text",
      durationMin: 6,
    }),
  ],
);

const WEEK_4 = mod(
  "mod-week-4",
  "week-4-integrations",
  "Week 4 - Integrations (Meta + Zapier + Make)",
  "Integrate everything: Meta, Zapier, Make, MCP, and agent tools.",
  5,
  Plug,
  "linear-gradient(135deg,#5B0EFF,#FF0BD6)",
  [
    L("niche-integration-guide", "Niche Integration Guide (Zapier + Make)", {
      kind: "text",
      durationMin: 10,
    }),
    L("zapier-mcp", "Zapier MCP", { durationMin: 9 }),
    L(
      "add-tools-to-ai-agent",
      "How to Add Tools to Your AI Agent (Step by Step)",
      { durationMin: 14 },
    ),
  ],
);

export const MODULES: Module[] = [
  ORIENTATION,
  WEEK_1,
  WEEK_2,
  WEEK_3,
  WEEK_4,
];

export function getModule(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getLesson(
  moduleSlug: string,
  lessonId: string,
): { module: Module; lesson: Lesson } | undefined {
  const module = getModule(moduleSlug);
  if (!module) return undefined;
  const lesson = module.lessons.find((l) => l.id === lessonId);
  if (!lesson) return undefined;
  return { module, lesson };
}

export const TOTAL_LESSONS = MODULES.reduce((n, m) => n + m.lessons.length, 0);

/**
 * Catalog metadata for the one live course. The modules above ARE its modules;
 * its card on /classroom deep-links into the first lesson.
 */
export const COURSE_30DAY = {
  title: "30 Days Challenge",
  description:
    "The free AssignX agency partner course: a 4-week path from first setup to your first launch.",
  Icon: Rocket,
  accent: "linear-gradient(135deg,#7802DF,#FF0BD6)",
  moduleCount: MODULES.length,
  lessonCount: TOTAL_LESSONS,
  firstLessonHref: `/classroom/${MODULES[0].slug}/${MODULES[0].lessons[0].id}`,
};

/**
 * The clips (player units) for a lesson. A video lesson maps to one clip; its
 * `video` URL is parsed into a provider/id so the player can pick YouTube
 * (rich), Loom (embed) or the simulated placeholder. Text lessons have none.
 */
export function getLessonClips(lesson: Lesson): Clip[] {
  if (lesson.kind === "text") return [];
  const video = parseVideo(lesson.video);
  return [
    {
      id: lesson.id,
      title: lesson.title,
      durationSec: 30,
      ...(video ? { video } : {}),
    },
  ];
}

/** Retained for the admin panel; the new curriculum has no homework sections. */
export function hasHomework(): boolean {
  return false;
}
