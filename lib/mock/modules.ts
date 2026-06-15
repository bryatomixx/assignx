import { Rocket, TrendingUp, Mic, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Module, Lesson, Bullet, Clip, LessonSection } from "@/lib/types";

/** Tiny helper to build bullet trees readably. */
const b = (text: string, children?: Bullet[], href?: string): Bullet => ({
  text,
  ...(children ? { children } : {}),
  ...(href ? { href } : {}),
});

const NOTION_RESOURCE_HUB =
  "https://www.notion.so/AssignX-Resource-Hub-Partners-21997b2f3bbe80799837ffd9494574fc?showMoveTo=true";

/**
 * 30 Days Challenge — the free AssignX Agency Partner course.
 * A 4-week curriculum (Orientation + weekly lessons), each with material + homework.
 */
const courseLessons: Lesson[] = [
  {
    id: "orientation",
    title: "Orientation",
    subtitle: "Start here",
    durationMin: 60,
    videoUrl: "",
    content:
      "Get set up before the course starts. Bookmark your core tools, complete the platform basics, and lay your agency's foundation.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Intro to agency"),
          b("Stripe setup"),
          b("Twilio setup"),
          b("Twilio Trust Hub"),
          b("Platform Walkthrough"),
          b("Bookmark", [
            b("app.assignx.ai", undefined, "https://app.assignx.ai"),
            b("Skool"),
            b("Twilio.com", undefined, "https://twilio.com"),
          ]),
        ],
      },
      {
        heading: "Homework (on Skool)",
        bullets: [
          b("Create agency plans", [b("Subscription strategy")]),
          b("Go through Agency essentials"),
          b("Setup Internal Sub-accounts", [b("Setup internal use plan")]),
          b("Whitelabel setup", [
            b("Custom domain"),
            b("Email config"),
            b("Add brand / logo"),
            b("Widget"),
          ]),
          b("Agency Building Blocks", [
            b("AI AaaS Model"),
            b("Choosing a Niche"),
            b("How to name and brand"),
          ]),
          b("Finalize niche", [b("Pick your 1 official ICP")]),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w1d1",
    title: "Week 1 · Agency Platform Essentials",
    durationMin: 60,
    videoUrl: "",
    content:
      "Lock in your agency platform: integrations, plans, and a complete whitelabel.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Agency Review", [
            b("Review Agency Checklist"),
            b("Check Integrations", [b("Twilio & Stripe")]),
            b("Review Plans", [
              b("Internal Use plan"),
              b("Subscription plans"),
              b("Xbar Plans"),
            ]),
            b("Confirm they've seen the pricing strategy video on LinkedIn"),
          ]),
          b("Show clients creating accounts using agency link vs manually"),
          b("Agency Activity", [
            b("Show all subaccount activities and filtering"),
          ]),
          b("Whitelabel Setup", [
            b("Branding"),
            b("Domain setup"),
            b("Email config"),
            b("Notification Config"),
            b("Tutorial Videos"),
            b("Support Widget"),
            b("Resource Hub — duplicate this", undefined, NOTION_RESOURCE_HUB),
          ]),
          b("Upsell", [
            b("Terms, Privacy, Refund"),
            b(
              "Understanding the Agency Plans (what's best value)",
              undefined,
              "https://www.assignx.ai/agency-plans",
            ),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Finish agency checklist"),
          b("Finish setting up plans for clients"),
          b("Create internal agency use account"),
          b("Finish whitelabel setup"),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w1d2",
    title: "Week 1 · Agency Use + Internal Agents",
    durationMin: 60,
    videoUrl: "",
    content:
      "Build your first internal agents off proven templates and wire up your lead pipeline.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Agency Use walkthrough / review", [
            b("Agents in the pipeline"),
            b("Messages in the pipeline"),
            b("Cover the zap template to setup Facebook to AssignX"),
          ]),
          b("Review our internal sales agent (Zillow Agent)"),
          b("Show how to create an agent using the Zillow agent", [
            b("Copy + paste the (objective, greeting, script)"),
            b("Add to Agency use pipeline"),
            b("Assign a number"),
            b("Stage configuration"),
            b("Configure your hot lead based on the specific script"),
            b("Get Niche + Target area to help get 1000 leads"),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Watch the video where I explain how to use it"),
          b("Use the docs here to access templates"),
          b("Build agents using templates (2 hrs)", [
            b("Create the Meta Leads Agent"),
            b(
              "Create the Prospecting Agent to cold call for your niche — use Internal Zillow Agent as example",
            ),
          ]),
          b("Using the messaging template — for cold call or paid ads (3 hrs)", [
            b("Create templates for new lead, follow up, booked, no-show stages"),
            b("Bonus: messaging for account created, trial, paying, cancelled"),
          ]),
          b("Setup zap from Facebook to AssignX (if running paid ads)"),
          b("Subaccount Platform Walkthrough", [
            b("AssignX Intro"),
            b("How to start a campaign (step by step)"),
            b("Pausing and resuming calls"),
            b("Importing Leads + Smartlist"),
            b("Connecting calendar"),
            b("KYC"),
            b("Lead Enrichment"),
            b("What is smart refill"),
            b("Upload leads in their account once we've emailed it"),
          ]),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w2d1",
    title: "Week 2 · AI Agents Launching",
    durationMin: 60,
    videoUrl: "",
    content:
      "Take your prospecting agents live: prompt review, the launch checklist, and a real call demo.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("15 mins of Q&A on Agency Use or creating agents"),
          b(
            "Call on one person to walk us through their prospecting agent prompt (20 mins)",
            [b("Giving feedback in real time")],
          ),
          b("Agent checklist", [
            b("Calendar connected"),
            b("Assigned to stages with proper cadence"),
            b("Phone number claimed"),
            b("Twilio TrustHub"),
            b("Confirm the 500 leads have been uploaded"),
            b("Confirm who has a website or will need to create one"),
          ]),
          b("Sample whitelabel pages", [
            b("NextGen", undefined, "https://www.nexgenaigrowth.com/"),
            b("Left Coast", undefined, "https://www.leftcoast.ai/"),
            b("Fassa", undefined, "https://www.fassax.ai/"),
            b("synqAGENT", undefined, "https://www.synqagent.com/"),
          ]),
          b("Demo a live call of the AssignX Live website agent (15 mins)", [
            b("Review prompt structure"),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Clean up V1 agent for prospecting (30 mins)"),
          b("Create a V2 agent for prospecting (1 hr)", [
            b("New Greeting"),
            b("New opener"),
            b("New pitch"),
          ]),
          b("Launch both V1 and V2 agents for cold calling (1.5 hr)", [
            b("Connect calendar (cal.com or GHL cal for booking)"),
            b("Agent assigned to pipeline with proper cadence"),
            b("Twilio TrustHub approved"),
            b("A2P approved — bonus"),
            b("Drip 20 leads per day"),
          ]),
          b("Bonus: Reviewing AI Agent prompts (1.5 hr)", [
            b("Meta Ads Setter"),
            b("Google PPC Agent"),
            b("Live Website Demo"),
            b("Jarvis Personal AI Agent"),
            b("Real Estate — Zillow Agents"),
            b("Alex.ai"),
          ]),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w2d2",
    title: "Week 2 · Sales Deck + Pitch Practice",
    durationMin: 60,
    videoUrl: "",
    content:
      "Build and rehearse the pitch: deck structure, pricing, and live practice.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Sales Workshop format", [
            b("Disco, Deck, Dropping link, helping them build their first agent"),
            b("Identifying who wants an Xbar or a prospect worth nurturing"),
          ]),
          b("Sales deck review", [
            b("Why things are on the deck (full overview)"),
            b("Looking at pricing model + comparing to what they have"),
            b("Understanding their niche and how to repurpose this for that"),
            b("One-to-one vs one-to-many calls and why we recommend one-to-many"),
            b("Adjusting audio for stages — agents demo"),
          ]),
          b("Sales principles"),
          b("How to screenshare without showing your presenter notes"),
          b("Book a 1hr pitch review session", [
            b("Bonus session after they practice their pitch"),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b(
            "Matthew's workshop",
            undefined,
            "https://fathom.video/share/w8ocSBL-eoDKfSe3iT_Stnuxn1V5ydiR",
          ),
          b(
            "Review walkthrough with David / Manuel",
            undefined,
            "https://www.loom.com/share/85b96828e69b42fcaf45e5ec2c09c77a",
          ),
          b("Create their own deck on Canva or Gamma"),
          b("Practice sales deck (2x) — pitching live next meeting"),
          b("Learn how to conduct a workshop — Noah's workshop"),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w3d1",
    title: "Week 3 · Sales + Marketing (Funnels, Ads)",
    durationMin: 60,
    videoUrl: "",
    content:
      "Stand up your funnels and ads: registration funnels, VSLs, and ad creatives.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("15 min Q&A on", [
            b("Prospecting agent questions"),
            b(
              "Direct QA questions to Alex's calendar",
              undefined,
              "https://api.leadconnectorhq.com/widget/bookings/support-calendar-assignx",
            ),
          ]),
          b("Workshop Funnel (20 mins)", [
            b("Review Canva"),
            b("Real Estate website", undefined, "https://www.assignx.ai/opt-in"),
            b(
              "Insurance website",
              undefined,
              "https://agent-x-5993ea.webflow.io/opt-in-insurance",
            ),
          ]),
          b("Account Registration Funnel (20 mins)", [
            b("AssignX Website", undefined, "https://www.assignx.ai/funnel"),
            b(
              "Clinic / Medspa Website",
              undefined,
              "https://www.leftcoast.ai/funnel",
            ),
            b(
              "Insurance Website",
              undefined,
              "https://www.synqagent.com/funnel",
            ),
            b("VSL for funnel page"),
          ]),
          b("Ads (20 mins)", [
            b("Review creatives (Marketer + Real Estate + Shopify Store Owner)"),
            b("Ads Library — research or spy on competition"),
            b("Zapier Review — FB page to AssignX"),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Finalize sample deck"),
          b("Start setting up website + funnel", [
            b("Option to go with our Done-for-You service"),
          ]),
          b("Create an Alex Hormozi marketing agent to help with ad creatives"),
          b("Create Headline / desc / creative agent prompt"),
          b("Create live site agent"),
          b("Connect the live site agent on website"),
          b("Review Lead Gen Methods"),
        ],
      },
    ],
    resources: [
      {
        id: "w3d1-canva",
        label: "Funnel design (Canva)",
        href: "https://canva.com/design/DAGcRD2V3W8/PMwmhgBqCzqR3Fow8AsJxA/edit",
      },
    ],
  },
  {
    id: "w3d2",
    title: "Week 3 · Integrations",
    durationMin: 60,
    videoUrl: "",
    content:
      "Connect everything: Zapier, GHL, FUB, webhooks, tools/actions, and MCP.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Zapier integration", [
            b("Facebook to AssignX", [b("Canva Outline"), b("Zap outline")]),
            b("GHL to AssignX", [b("Canva Outline"), b("Zap Outline")]),
            b("FUB to AssignX", [b("Canva Outline"), b("Zap Outline")]),
          ]),
          b("GHL Workflows", [
            b("Making a call from GHL"),
            b("Webhook details"),
          ]),
          b("Tools + Actions", [
            b("Adding tools to your AI agent (adding Gmail, ClickUp)"),
            b("MCP Explained"),
            b("Make Scenarios", [b("You can also create Make scenarios")]),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Watch Industry Agnostic"),
          b("Create your zap templates for your niche on your own Zap account", [
            b("Facebook zap"),
            b("CRM Zap (e.g. GHL, Pipedrive)"),
          ]),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w4d1",
    title: "Week 4 · Xbar SOP + Fulfillment",
    durationMin: 60,
    videoUrl: "",
    content:
      "Package and deliver Xbars: pricing, niche integrations, and the fulfillment SOP.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Review the Xbar SOP Process (30 mins)"),
          b("XBars & Enterprise Plans (15 mins)", [
            b("Review their Xbar pricing and packaging", [
              b("Ex: $1997 (2 AI Agents, 2 External Integrations)"),
            ]),
            b("Niche Integrations — have they looked at their niche integration?"),
            b("Ask if they know the common niche integrations"),
            b("They should start creating templates in their Zapier"),
          ]),
          b("Review sample Xbar Integrations (15 mins)", [
            b("GHL to AssignX", [b("Canva Outline"), b("Zapier")]),
            b("FUB to AssignX", [b("Canva")]),
          ]),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Watch the following resources", [
            b("AI Workshop — Closed 2 Xbars"),
            b("Support webinar — 3 Closed Xbars"),
            b("John Graff — Demo Day"),
            b("Xbar ClickUp Training walkthrough"),
          ]),
          b("Industry XBar Walkthrough (25 mins)", [
            b("Explainer Video"),
            b("Canva Walkthrough"),
            b("Pay attention to: System Integration, Fulfillment time, Zaps / flows"),
          ]),
        ],
      },
    ],
    resources: [],
  },
  {
    id: "w4d2",
    title: "Week 4 · Launch Checklist",
    durationMin: 60,
    videoUrl: "",
    content:
      "Your go-live checklist: agents, sales deck, whitelabel, landing page, funnel, and ads.",
    sections: [
      {
        heading: "What you'll cover",
        bullets: [
          b("Agents", [
            b("Website Demo agent: lives on your website"),
            b("Prospecting agent: reaches out and prospects for you"),
          ]),
          b("Sales deck: the deck you'll use to pitch on workshops (our sample)"),
          b("Agency Widget Links"),
          b("Notion Resource Hub", undefined, NOTION_RESOURCE_HUB),
          b("Hire the team link — Calendar"),
          b("Whitelabel items complete", [b("Email, Domain, Widget, etc.")]),
          b("Landing Page is live", [
            b("Inspo", [
              b("Medspa", undefined, "https://www.leftcoast.ai/"),
              b("Insurance", undefined, "https://www.synqagent.com/"),
              b("Dental", undefined, "https://nextgenailp.webflow.io/"),
              b("Real Estate", undefined, "https://fassa-b695c8.webflow.io/"),
            ]),
            b("Try Demo button working"),
            b("Sample call recordings"),
          ]),
          b("Funnel page", [b("VSL for funnel page")]),
          b("Meta Ads Manager: if you don't have one ready yet, get started"),
          b("FB/IG Business Page: create a business page to run ads from"),
        ],
      },
      {
        heading: "Homework",
        bullets: [
          b("Finish what is not done"),
          b("Need tech support — connect with Alex"),
          b("Partner Program Call with Noah for Case Study"),
        ],
      },
    ],
    resources: [],
  },
];

export const COURSE: Module = {
  id: "mod-30-day",
  slug: "30-day-challenge",
  title: "30 Days Challenge",
  description:
    "The free AssignX Agency Partner course — a 4-week path from setup to launch. Orientation plus weekly lessons, each with material and homework.",
  order: 1,
  access: "free",
  Icon: Rocket,
  accent: "linear-gradient(135deg,#7802DF,#FF0BD6)",
  lessons: courseLessons,
};

/** Advanced modules — shown locked (preview only) behind the paid tier. */
const paidModule = (
  id: string,
  slug: string,
  title: string,
  description: string,
  order: number,
  icon: LucideIcon,
  accent: string,
  lessonTitles: string[],
): Module => ({
  id,
  slug,
  title,
  description,
  order,
  access: "paid",
  Icon: icon,
  accent,
  lessons: lessonTitles.map((t, i) => ({
    id: `${slug}-l${i + 1}`,
    title: t,
    durationMin: 10 + ((i * 4) % 15),
    videoUrl: "",
    content: `${t}. Premium lesson content for AssignX Certified Partners.`,
    resources: [],
  })),
});

const advancedModules: Module[] = [
  paidModule(
    "mod-scale",
    "agency-scaling",
    "Agency Scaling System",
    "The operating system to go from 5 to 50 clients without breaking. SOPs, hiring, and delivery at scale.",
    2,
    TrendingUp,
    "linear-gradient(135deg,#7802DF,#5B0EFF)",
    [
      "The Delivery Machine: SOPs & Templates",
      "Hiring Your First Builder Team",
      "Account Management at Scale",
      "Productizing Your Offer",
      "Building Recurring Revenue Beyond Retainers",
    ],
  ),
  paidModule(
    "mod-voice",
    "advanced-voice-agents",
    "Advanced Voice Agents",
    "Deep-dive into human-grade voice: latency, barge-in, lag compensation, and enterprise call flows.",
    3,
    Mic,
    "linear-gradient(135deg,#430596,#FF0BD6)",
    [
      "Voice Architecture & Latency",
      "Designing Natural Turn-Taking",
      "Enterprise Call Routing",
      "Compliance & Call Recording",
    ],
  ),
  paidModule(
    "mod-enterprise",
    "enterprise-deals",
    "Closing Enterprise Deals",
    "Sell five-figure agent deployments to bigger companies — procurement, security reviews, and pilots.",
    4,
    Building2,
    "linear-gradient(135deg,#7802DF,#300FFF)",
    [
      "Mapping the Enterprise Buyer",
      "Running a Paid Pilot",
      "Security & Procurement Reviews",
      "Pricing Five-Figure Deployments",
    ],
  ),
];

export const MODULES: Module[] = [COURSE, ...advancedModules];

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
 * Returns the first LessonSection that is NOT a homework section.
 * Typically the "What you'll cover" block.
 */
export function getCoverSection(lesson: Lesson): LessonSection | undefined {
  return lesson.sections?.find((s) => !/homework/i.test(s.heading));
}

/**
 * Derives the playlist of clips for a lesson from the top-level bullets
 * of its cover section. Duration varies slightly per index so demo clips
 * feel distinct (10-14s range, always >= 8s so the 5s countdown is visible).
 * Falls back to a single 20s clip when there is no cover section.
 */
export function getLessonClips(lesson: Lesson): Clip[] {
  const cover = getCoverSection(lesson);
  if (!cover || cover.bullets.length === 0) {
    return [{ id: `${lesson.id}-c0`, title: lesson.title, durationSec: 20 }];
  }
  return cover.bullets.map((bullet, i) => ({
    id: `${lesson.id}-c${i}`,
    title: bullet.text,
    // Stagger duration: 10, 12, 11, 13, 10, 12, ... (never < 8)
    durationSec: 10 + ((i * 2) % 5),
  }));
}

/** Whether a lesson includes a Homework section. */
export function hasHomework(lesson: Lesson): boolean {
  return !!lesson.sections?.some((s) => /homework/i.test(s.heading));
}

/** All lessons across modules that include homework. */
export function lessonsWithHomework(module: Module): Lesson[] {
  return module.lessons.filter(hasHomework);
}
