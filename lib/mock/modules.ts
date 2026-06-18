import { Compass, Rocket, Phone, TrendingUp, Plug } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Module, Lesson, Clip, Resource } from "@/lib/types";
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
  /** Optional banner image (public path) shown above the content. */
  image?: string;
  imageAlt?: string;
  /** Optional downloads / external links shown in a Resources section. */
  resources?: Resource[];
}

/** Compact lesson builder. */
const L = (id: string, title: string, opts: LessonOpts = {}): Lesson => ({
  id,
  title,
  durationMin: opts.durationMin ?? 8,
  ...(opts.kind ? { kind: opts.kind } : {}),
  ...(opts.video ? { video: opts.video } : {}),
  ...(opts.content ? { content: opts.content } : {}),
  ...(opts.image ? { image: opts.image } : {}),
  ...(opts.imageAlt ? { imageAlt: opts.imageAlt } : {}),
  resources: opts.resources ?? [],
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
        video: "https://www.loom.com/share/ed734e01ebfd4d2b8f54f030b1ea3f90",
        durationMin: 6,
        content: `Welcome to your Agency Partner Orientation. In this session, we'll walk through the AI Agents-as-a-Service opportunity, show you how the platform works from an operator's perspective, and help you get your agency account set up for the 30-Day Challenge.

You'll learn how agencies are using the platform to sell AI agents at scale, create recurring subscription revenue, and operate with a SaaS model instead of traditional fulfillment-heavy retainers. We'll also cover the key action items to complete before the live workshop, including creating your agency account, connecting Twilio and Stripe, setting up your first pricing plan, and creating your first sub-account/demo environment.

The goal is simple: come prepared, stay focused, and get ready to build a real AI agency with infrastructure you can scale.`,
      },
    ),
    L("mission-and-vision", "AssignX - Mission and Vision", {
      video: "https://youtu.be/d-8BzXztiU8?si=YYV-XbA814iqBt-i",
      durationMin: 8,
      content: `In this video, you'll understand the bigger vision behind AssignX and why AI agents are becoming one of the biggest shifts in modern business.

We'll break down:
• Why AI is changing the way companies scale
• How modern businesses are creating leverage with AI
• What the AI AaaS model actually means
• Why this opportunity is bigger than just automation
• How agency owners are using AI agents across industries like real estate, recruiting, legal, solar, e-commerce, marketing, and more

This community isn't just about learning a platform. It's about learning how to build smarter systems, create leverage, and position yourself for where business is heading next.

You're early. Let's build the future together. ⚡`,
    }),
    L(
      "inside-ai-aaas-model",
      "Inside the AI AaaS Model (What you ACTUALLY DO)",
      {
        video: "https://www.loom.com/share/bf924572cf644176933325110cebbdeb",
        durationMin: 12,
        content: `In this video, you'll see exactly what running an AI agency looks like in the real world: day to day, client by client. I walk you through the actual setups we've built for solar, law, and real estate clients that collectively added $93.2M in deals in the last 6 months, while replacing SDRs, receptionists, and intake teams with AI agents.

You'll see how we plug AssignX into CRMs like Salesforce, Clio, Follow Up Boss, Vulcan7, Google My Business, calendars, and zaps, then let the AI handle qualification, intake, bookings, and live transfers while the humans just close.

By the end of this video, you'll understand:
• What you really do as an AI agency owner (no-code, integration, system design, not heavy dev)
• How we set up Catalyst Solar to reactivate 12,000 leads, triple pipeline activity, and save ~$15K/month in SDR payroll
• How we helped a PI law firm automate 85% of intake, save 40+ hours/week, and recoup their setup fee in the first month
• How a Berkshire Hathaway brokerage added $4.3M to their pipeline in 3 weeks with AI agents replacing ISAs
• The TAM / SAM / SOM behind these industries and why each one is a potential $100M+/year AI agent opportunity
• Who AssignX is actually built for (and who it's not) so you can be brutally honest with yourself going in

Watch this before you overthink "what will I actually be doing?" This is the clearest picture of the work, the value, and the upside of building your own AI agency.`,
      },
    ),
    L("build-enterprise-value", "How to Build Enterprise Value With AI", {
      video: "https://youtu.be/_HG0fpAjmAE?si=N6Dfql8_VRGj8oJu",
      durationMin: 10,
      content: `Everything is changing right now.

Businesses are replacing manual work with AI infrastructure, and the people who understand how to deploy AI agents today will be the ones leading tomorrow.

In this video, you'll learn why AI Agents-as-a-Service is one of the biggest opportunities today, how businesses are shifting from selling time to deploying infrastructure, and how you can start building scalable AI systems that generate recurring revenue.

This community was built for entrepreneurs, agency owners, and builders who want to stop selling time and start building scalable systems with AI.

Inside, you'll learn how to:
• Build and deploy AI Agents-as-a-Service
• Create recurring revenue with AI infrastructure
• Launch and scale your AI agency
• Use AssignX to build real AI teams for real businesses
• Automate sales, support, operations, and more

This isn't about hype or theory. It's about building assets that scale.

You're not here to work harder. You're here to build systems that work for you.

Whether you're just getting started or already building with AI, this community will give you the tools, strategies, support, and training to move faster.

The future of work is already here. Now it's your turn to build with it.`,
    }),
    L("os-x-operating-system", "OS-X: The AI Operating System for Sales", {
      video: "https://youtu.be/5nMaeRz7p10?si=Jkwefau8grcm5feQ",
      durationMin: 9,
      content: `Most AI agents today are just automations pretending to be intelligent.

In this video, you'll learn what makes OS-X different, why most AI systems fail to operate like real team members, and how AssignX is building AI infrastructure designed for real sales and support operations.

OS-X is not just a chatbot or a workflow builder. It's an AI Operating System designed to reason, communicate, and execute.

You'll see how OS-X combines:
• Real reasoning that handles conversations dynamically
• Human-level voice interactions that build trust
• High-speed performance that keeps conversations natural and fluid
• Tools and Actions that allow the AI to execute tasks, not just respond

From updating CRMs and triggering follow-ups to handling operational workflows, this is AI built to operate like a real part of a business.

No brittle workflows. No constant supervision. No scripted conversations.

This is a different approach to AI automation. This is OS-X.

Inside this community, you'll continue learning how to build, deploy, and scale AI systems using AssignX to create real business infrastructure powered by AI.`,
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
      video: "https://www.loom.com/share/38540394b55646b480ed615ffa0539de",
      durationMin: 7,
      content: `Visit https://app.assignx.ai/agency/onboarding to get started.`,
    }),
    L("agency-platform-walkthrough", "Agency Platform Walkthrough", {
      video: "https://www.loom.com/share/a896337e1020415cb44b0d6ab30dbcf1",
      durationMin: 15,
      content: `What This Walkthrough Covers

In this video, you'll get a guided tour of the entire AssignX Agency Platform so you know exactly where everything lives and how to navigate like a pro.

We start at the dashboard and walk through all the foundational areas you'll use to operate, monetize, and scale your AI agency.

Here's what's covered, step-by-step:

1. The Agency Dashboard
• Daily active users, monthly active users
• Session length & user behavior
• High-level SaaS analytics that show the health of your agency

2. Revenue & Monetization
• Total revenue, ARR, MRR
• Stripe balance, next payouts, average ticket size
• Lifetime earnings and transaction logs
• Leaderboards to see your top-spending sub-accounts

3. Your Setup Checklist
• Connecting Stripe
• Connecting Twilio
• Creating your pricing plans
• Understanding the X-Bar (your version of the Apple Genius Bar for done-with-you setup)
• Inviting sub-accounts

4. Integrations
• Twilio setup
• Stripe connection
• How integrations affect phone numbers, billing, and platform operations

5. Plans & X-Bar Configuration
• Creating, editing, and managing subscription plans
• Setting up your X-Bar done-for-you offerings

6. Sub-Accounts
• Where all client accounts live
• How to monitor and manage all sub-account activity

7. Activity & Campaign Analytics
Platform-wide view of:
• Calls, SMS, email activity
• Active campaigns
• Volume per sub-account
• Total calls/messages/emails across the entire agency

8. Teams
• How to invite VAs or partners
• Permission and access controls

9. White-Label Settings
• Branding (logo, colors)
• Custom domain
• Email configuration
• Notification messages (payment failures, trial reminders, gamification nudges)

10. The Support Widget
How to route support to:
• Your community
• Calendly
• A help desk
• Your own internal team

11. In-App Purchases
Setting your markup on:
• Phone numbers
• DNC checks
• Lead enrichment
• API calls
• Upcoming lead databases (Apollo, ZoomInfo, etc.)

12. Your Billing Profile
• Your own subscription
• Transaction history
• Receipts and billing records

🎯 What You Can Expect to Get Out of This Video

By the end of the video, you'll:

✔ Know exactly where everything is inside your agency backend
No more guessing. You'll feel completely oriented around your revenue, sub-accounts, settings, integrations, and in-app monetization.

✔ Understand the key levers for scaling your agency
You'll learn how to use your pricing plans, X-Bar setup, in-app upsells, and Stripe integration to generate recurring revenue and upsell demand across your sub-accounts.

✔ See how the AssignX engine works behind the scenes
You'll understand how calls, messages, analytics, billing, and campaigns are tracked across every sub-account in real time.

✔ Know how to customize the platform to your brand
From your domain to your emails to your support flow, you'll know how to make the platform feel 100% like your own SaaS.

✔ Be ready for onboarding clients confidently
Once you complete the setup checklist, you'll be fully equipped to start inviting sub-accounts, selling plans, and letting your AI agents do the work.`,
    }),
    L("choose-perfect-niche", "Choose The Perfect Niche (Step by Step)", {
      kind: "text",
      durationMin: 10,
      content: `The AssignX Niche Selection Framework

A data-driven, leverage-based guide for picking a niche that prints revenue.

Choosing the right niche can be the difference between struggling to sell your AI agent and scaling to $20K-$50K/month with ease. This framework removes the guesswork and shows you exactly what to look for when deciding who your AI agents will serve.

Below is a clear, strategic outline you can follow so you select a niche with strong upside, real demand, and long-term scalability.

I. Start With This Rule: "Each Dial = a Dollar"

The best niches are the ones where every missed call is lost revenue, and every answered call is an opportunity.

These niches:
• depend on volume
• depend on fast follow-up
• depend on consistent outreach
• and already measure their success in calls, contacts, and conversations

Your AI agent becomes an instant revenue multiplier, not an expense.

Examples:
• Real estate agents
• Solar companies
• Insurance agents
• Law firms doing intake
• Med spas doing appointment setting
• Recruiters
• B2B appointment-setter agencies

These businesses live and die by how many conversations they can generate each day.

II. Pick Niches That Already Budget for Lead Generation

You don't want to convince a niche that "leads matter." You want a niche that's already spending heavily on:
• Paid ads (Facebook, Google, TikTok)
• Data lists
• Cold calling
• SMS campaigns
• Appointment setters
• CRMs + automation tools

Why? Because when a business is already spending money to get prospects, they immediately understand the value of a follow-up AI agent that never sleeps, never forgets, and calls instantly.

These niches have the mindset: "If this helps me squeeze more deals from my leads, I'll pay for it." That's what you want.

III. Choose Niches with High Call Volume (More Calls = More Revenue For You)

Your revenue increases with:
• More AI agents per account
• More credits burned
• More lead uploads
• Higher usage
• More seats
• More sub-accounts

So you want niches that make a lot of calls, such as:
• Real estate prospecting (FSBO, expireds, circle prospecting)
• Solar appointment setting
• Insurance intake
• Dental & med spa appointment confirmations
• Law firm qualification & screening
• B2B pipeline builds
• Recruiting outreach at scale

High-volume niches = consistent recurring revenue for you.

IV. Play to Your Personal Leverage (Your Background = Your Advantage)

If you've worked in a niche before, you have built-in authority:
• Are you a realtor?
• Have you worked in insurance?
• Were you in B2B outbound sales?
• Have you run ads or done marketing for local businesses?
• Do you come from a medical background?
• Have you worked with lawyers?

Your prior experience gives you the language, the customer psychology, the objections, the workflow knowledge, and insider understanding. This makes it 10x easier to sell your AI agent, because you already "get" the niche better than a beginner.

V. Think National, Not Local

This is not door-to-door sales. You're not limited to your city, your neighborhood, or your state. With an AI agent, your potential market is all 50 U.S. states + all of Canada.

Every niche is massive. There are:
• 2M+ real estate agents
• 700K+ insurance agents
• 1M+ lawyers
• 40K+ med spas
• 200K+ dental clinics
• Tens of thousands of solar installers
• Millions of B2B businesses needing sales calls

This isn't a "local business" opportunity. It's a nationwide SaaS opportunity.

VI. Filter Your Niche Using This 6-Point Scorecard

Rate each niche from 1-5:

1. Does the niche value conversations? If their business depends on calls = 5/5.
2. Do they already spend on lead generation? Ad buyers, list buyers, CRM users = 5/5.
3. Do they have a monetizable follow-up problem? If "slow follow-up" kills their revenue = 5/5.
4. Will your agent save them money or make them money? If they're paying appointment setters = 5/5.
5. Do you have personal background or insight in the space? If yes = huge leverage.
6. Is the niche large enough to scale nationwide? Should have 50K+ potential buyers.

Any niche with 20/30 or higher is worth testing.

VII. Final Step: Validate Fast (Don't Overthink It)

Once you pick a niche:
• Build one agent for that use case
• Create a simple demo
• Reach out to 20-30 businesses in that niche
• Get feedback
• Close your first paying users
• Double down if the response is strong

You're not choosing a niche for life. You're choosing a niche to get traction fast, get revenue, and learn. You can expand later.`,
    }),
    L(
      "name-brand-agency",
      "How to Name & Brand Your AI Agency (Use Prompt)",
      {
        kind: "text",
        durationMin: 8,
        content: `A simple framework to create a memorable, premium, future-proof brand.

1. What Makes a Strong AI Agency Name?

Your brand name should check at least 4 out of 5 of these:

✅ Short & punchy (1-2 words max)
Long names die fast. Short names get remembered, shared, and typed easily.

✅ Feels tech-forward and modern
Think: AssignX, OpenAI, Apollo, Cohere, Vanta, Stripe. Clean, futuristic, confident.

✅ Easy to say & spell
If people hesitate while saying it, it's wrong. If they have to ask "how do you spell it?", it's wrong.

✅ Generic enough to expand into multiple niches
DO NOT name your agency:
❌ "SolarAI Agents"
❌ "RealEstateAI.io"
❌ "CallBotsForDentists LLC"
Name it once. Use it across all niches forever.

✅ Domain available (.com is best but not mandatory)
If the .com is taken, you can use .ai, .io, .co, get{name}.com, or try{name}.com.

2. Proven Naming Formulas (Pick One)

Formula A: Real Word + X
AssignX, VisionX, LogicX, PipelineX, CallX. Works because it feels techy and scalable.

Formula B: Short invented futuristic names
Zuno, Avara, Xylo, Viro, Lumo. Great for brandability.

Formula C: Action Verb + AI
ConnectAI, QualifyAI, EngageAI, ConvertAI. Straight to the point.

Formula D: Concept + Tech
Signal Labs, Prospect Systems, Echo Ops, Nova Engine.

3. Branding Guidelines (Beginner-Friendly)

Step 1: Pick a color palette
Use 2-3 colors max, typically:
• A primary (purple/blue/green)
• A secondary (black/charcoal)
• An accent (electric blue / neon green / magenta)
Modern AI brands lean toward Blue (#3B82F6), Purple (#7C3AED), Teal (#14B8A6), and Deep charcoal (#0F0F0F).

Step 2: Choose a clean tech font
Stick to ONE of these: Inter, SF Pro, Helvetica Now, Poppins, or Sora. Use 2 weights: Bold (headlines) and Regular (body text).

Step 3: Style your logo simple
• No mascots
• No complicated symbols
• No gradients unless subtle
• Use a single geometric shape or a stylized letter
Examples: AssignX logo is a minimal X, Stripe is a simple line, OpenAI is a clean geometric knot.

Step 4: Define your brand voice
You only need ONE sentence: "Our voice is clear, confident, and helpful, never hypey or confusing." Or choose one:
• Apple-like: clean, minimalist, visionary
• Stripe-like: technical, trustworthy, modern
• Tesla-like: bold, futuristic, disruptive

Step 5: Apply consistency everywhere
Same colors. Same fonts. Same voice. Same layout spacing. Every page, every graphic, every slide. It compounds into premium.

4. Questions to Ask Yourself Before Finalizing a Name
• Does it sound premium when said out loud?
• Can someone spell it after hearing it once?
• Does it box me into a niche I might leave later?
• Can I see this being a 7-8 figure brand?
• Does it pair well with "AI," "Labs," or "Systems"?
• Domain available for under $25/year?
If YES, you found your name.

5. The Perfect Prompt to Generate AI Agency Names

Copy/paste this into ChatGPT:

🔥 AI Agency Naming Prompt

You are a premium brand strategist. Help me create 10-20 unique, modern, memorable brand names for my AI Agency.

Guidelines:
• Style: futuristic, minimal, 1-2 words
• Avoid cliché or generic names
• Avoid ultra-niche names tied to real estate, solar, etc.
• Should be easy to say, spell, and remember
• Should sound like a scalable tech company
• Provide .com, .ai, and .io availability suggestions
• Provide a one-line brand meaning/tagline for each name

My preferences:
• I like names similar in style to AssignX, OpenAI, Stripe, Apollo, Vanta
• I prefer [insert color palette or vibe you want]
• I want the name to feel [choose: bold, trustworthy, premium, futuristic, minimalist]

Generate options until I say stop.`,
      },
    ),
    L("stripe-setup-walkthrough", "Stripe Setup Walkthrough", {
      video: "https://www.loom.com/share/597a19d8de3e4420b2d04894a09333cf",
      durationMin: 9,
      content: `What This Walkthrough Covers

In this video, you'll learn exactly how to connect your Stripe account to AssignX so your payouts flow smoothly, on time, and without compliance issues. Because Stripe has strict verification rules, this video breaks everything down step-by-step so you avoid delays, failed payouts, or account holds.

Here's what's covered inside the walkthrough:

1. Entering the Stripe Onboarding Flow
• Launching the Stripe connection window
• Entering your phone number and email
• Handling the verification code to access Stripe's secure onboarding

2. Choosing Your Business Type
• Selecting Individual vs Company
• When to choose each option
• Understanding how Stripe uses this info to verify your identity and your banking details

3. Identity Verification
• Adding your personal details (name, address, phone number, SSN partial)
• Why this is required and how Stripe uses it
• Matching your address to your bank details
• What to use if you have an incorporated company vs no company

4. Adding Business Details
• Selecting your industry
• Adding your website (optional but helpful)
• Setting up your public-facing business information

5. Connecting Your Bank Account
• Searching for your bank (Wells Fargo, Chase, etc.)
• Connecting via Stripe's secure banking partner flow
• Or manually entering routing + account numbers
• What to expect if your bank requires additional authentication

6. Final Review & Submission
• Reviewing all business, personal, and banking details
• Submitting your Stripe application
• Waiting for confirmation and returning to the AssignX dashboard

7. Confirmation Inside AssignX
• How to confirm that your Stripe account is fully connected
• What it looks like once your bank and business profile are verified
• Where to view your connected payout details inside the platform

🎯 What You'll Get Out of This Video

By the end of the video, you'll:

✔ Have your Stripe account fully connected
No delays, no missing details, no payout interruptions. You'll know exactly what Stripe needs from you and how to provide it correctly.

✔ Avoid the most common mistakes that cause payout holds
You'll know how to enter matching addresses, which business type to select, what Stripe checks behind the scenes, and how to prevent verification flags before they happen.

✔ Be ready to receive payouts from your agency instantly
Once your Stripe is connected, your plans, your sub-account subscriptions, and your in-app purchases all begin paying out directly to your bank account.

✔ Understand the entire Stripe onboarding flow
Even if you've never used Stripe before, you'll walk away feeling confident navigating the verification process.

✔ Know how to verify everything is working properly in AssignX
You'll learn where to check that your connection succeeded and where your payout details live inside the platform.`,
    }),
    L("twilio-integration", "Twilio Integration", {
      video: "https://www.loom.com/share/d570ba46da97452787ca0c89060bb255",
      durationMin: 11,
      content: `In this video, you'll learn exactly how to connect your Twilio account to your AssignX Agency Platform and what each Twilio trust product means, so your phone numbers, call quality, SMS deliverability, and caller ID reputation all work seamlessly for you and your sub-accounts.

Here's everything this walkthrough covers:

1. Connecting Twilio to Your Agency Platform
• Navigating to the Twilio integration
• Clicking "Add" to begin the setup
• Copying your Twilio Account SID and Auth Token from your Twilio Console
• Pasting your keys into the platform to activate Twilio
• Verifying that your Twilio connection is successfully approved

2. Sub-Accounts Claiming Phone Numbers
Once Twilio is connected, sub-accounts can search for numbers, buy numbers based on area code, and use them for calls and SMS. You can upsell these numbers for profit. A deeper upsell breakdown is available in the School community.

3. Understanding Twilio Trust Products
The video explains what each trust product does and why it matters for your agency:

CNAM (Caller ID Name)
• Lets you add a branded caller ID
• Shows your business name when your AI agent calls
• Helps increase answer rates and professionalism

STIR/SHAKEN
• Verifies your number as legitimate
• Prevents carriers from marking your calls as spam
• Improves call trust on Verizon, AT&T, T-Mobile, etc.

Voice Integrity Registration
• Strengthens call authentication
• Ensures high-quality voice traffic
• Protects against reputation degradation

A2P 10DLC Messaging
• Required for sending SMS at scale
• Approves your number for text messaging
• More relevant for sub-accounts using campaigns

🎯 What You'll Get Out of This Video

By the end of this training, you will:

✔ Have Twilio fully connected to your AssignX agency
Your platform will be ready to support voice, SMS, and number provisioning for every sub-account you onboard.

✔ Understand every Twilio trust product and why they matter
No more confusion around STIR/SHAKEN, CNAM, A2P SMS, or voice integrity. You'll know exactly what each feature does and how it affects deliverability, call quality, and caller ID reputation.

✔ Be able to offer phone numbers instantly to your clients
Your sub-accounts can start claiming numbers immediately, enabling AI calling, SMS follow-ups, and full campaign automation.

✔ Increase your agency's revenue through upsells
You'll understand how phone numbers, trust product registration, and SMS capabilities can all become additional profit centers.

✔ Ensure your calls look clean, trustworthy, and not "spam-likely"
By registering your trust settings correctly, you'll protect call reputation and maximize answer rates.`,
    }),
    L("twilio-trust-hub", "Twilio Trust Hub Explained", {
      video: "https://www.loom.com/share/07c7018f52334cc8923ad5bd454e8c1a",
      durationMin: 8,
      content: `If your calls are getting ignored, flagged, or showing up as "Spam Likely", this is the fix.

In this video, I walk you step-by-step through connecting your Twilio account to your agent and setting up the Trust Hub products that actually improve call quality and deliverability.

We cover:
• How to connect Twilio using Account SID + Auth Token
• Where to find your credentials inside Twilio
• Why your calls get flagged (and how to stop it)
• Setting up CNAM (Caller ID name), SHAKEN/STIR (A-rated calls), and Voice Integrity (protect your number reputation)
• Buying your first phone number the right way
• Common mistakes that get your profile rejected

This is what turns your outbound from "ignored" to "answered."`,
    }),
    L("twilio-customer-profile", "Twilio - Customer Profile", {
      video: "https://www.loom.com/share/45e899a2e92544938484077549201105",
      durationMin: 7,
      content: `In this lesson, I walk you through setting up your Twilio Business Customer Profile, the foundation for getting your numbers verified, improving deliverability, and actually landing conversations.

We cover:
• How to access Trust Hub
• Creating your Business Customer Profile correctly
• Pay-As-You-Go setup (fastest way to unlock your account)
• Individual vs Business profiles (and when to use each)

This takes 5 minutes, but skipping it will cost you deals.`,
    }),
    L("week-1-assignment", "Assignment: Pick Your Niche & Offer", {
      kind: "text",
      durationMin: 5,
      content: `Time to put Week 1 into action. Complete your agency's foundation before moving on:

• Connect Stripe so your payouts are ready
• Connect Twilio so your numbers, calls, and SMS work
• Pick your niche using the selection framework
• Lock your branding (name, colors, and voice)

Once these four are done, you're ready to start onboarding sub-accounts and selling plans.`,
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
      video: "https://www.loom.com/share/7d8f6e13e55f4bfa82f7ef7d6f92e1a6",
      durationMin: 20,
      content: `This training walks you through exactly how we build, test, and optimize outbound AI agents that book real deals, using live call examples, conversation breakdowns, and the master prompt you can repurpose for any niche.

You'll see how our AI agent:
• Closed a $5K setup with John
• Helped generate a $10M pipeline in 17 days
• Turned cold calls into booked appointments using smart openers, objections, and KYC logic

If you've ever wondered, "What does a working AI agent actually sound like, and how do I build one for my niche?", this is the video.

🎯 What You'll Learn Inside This Video

1. Real Call Breakdowns: John & Stevie (From Cold Call to Close)
You'll hear:
• The exact opener that converted John
• How the AI handled "I'm eating right now" without backing off
• How it navigated multiple objections with empathy and persistence
• How it adapted to "Stevie" catching the wrong name and corrected mid-call
• How calls turned into booked appointments, 5K+ deals, and real pipeline
You'll see why the script is just the foundation: the real magic is in the structure, objections, and logic you give the agent.

2. The 3 Core Metrics: Answer Rate, Engagement, Conversion
You'll learn:
• How to think about answer rate (are people even picking up?), engagement (do they stay past 10-15 seconds?), and conversion (do they book, agree, or take the next step?)
• What a "normal" answer rate looks like (and when your lead source sucks)
• How opener quality affects hang-ups vs conversations
• Why "telemarketer energy" openers fail and curiosity-based openers win

3. Caller ID, Spam Ratings & Twilio Trust Hub
You'll understand:
• Why carriers (AT&T, Verizon, etc.) flag numbers as "Spam Likely"
• How they track number of dials, answer rate, and conversation duration
• Why your agent's performance is tied to number reputation
• How using Twilio Trust Hub & caller ID improves answer rates, reduces spam labeling, and increases total conversations
You'll also see how we built a Trust Hub section in the agency view so you (and your clients) can be set up correctly.

4. Crafting Openers, Pitches & Objection Handling That Actually Work
You'll see how we:
• Built the opener: "Are you still active in your farm?" (real-estate specific, curiosity-based)
• Tested different variations over time
• Expanded simple pitches into more context-rich, value-based openers
You'll learn the structure we use:
Opener → Permission → Pitch → Objection Handling → KYC → Close
And how we program the AI to:
• Not take the first "no" at face value
• Aim to hear up to seven "no's" before giving up
• Use empathy, "mirroring" key words from the objection, and soft but persistent frames

5. KYC (Know Your Customer) Questions & ICP Segmentation
You'll learn:
• What KYC is and why it's critical (beyond just "nice to have")
• How we segment within the same niche (real estate) into Zillow agents, Zillow Flex agents, Top 500 agents in SF/LA, and agents who sold 0 homes (70% stat)
• How KYC questions change based on who you're calling
• How we use KYC answers to qualify leads, understand their current lead gen, and spot opportunities (e.g. replacing outsourced prospecting)
You'll also see where KYC shows up in the pipeline view and how you can glance at answers without reading full transcripts.

6. Building, Duplicating & Split-Testing Agents
You'll see how to:
• Create your first outbound agent with Script #1
• Duplicate that agent and swap only the opener and the pitch
• Run A/B tests across answer rates, conversations, hot leads, booked calls, and total call time
This is how you stop guessing and start optimizing with data.

7. Master Prompt: Repurposing Our Script for Any Niche
You'll get a walkthrough of the Master Prompt we use to repurpose scripts. How it:
• Analyzes the original script
• Translates it into a new niche
• Rebuilds it with industry-specific language, real objections from that niche, and compliance/nuance baked in
You'll see how to plug in your niche (med spa, solar, law, nonprofit, home services, etc.), your target persona, and your primary goal. You can then drop the master prompt into ChatGPT, or use our built-in Script Builder that's already wired for AssignX agents.

8. Shared Memory, Inbound vs Outbound Agents & Fulfillment Flow
You'll learn:
• How outbound + inbound agents share memory, so if someone gets a call from an AI agent and calls back, the inbound agent already has the context
• Why you should almost always build an outbound agent (prospecting) and an inbound "twin" for callbacks & return calls
• How changes to the script (KYCs, objections, guardrails) sync between them
• How this plugs into calendars, CRMs (e.g., Follow Up Boss, Sisu, Clio, etc. depending on niche), and your pipeline
We also touch on fulfillment time (about 60 minutes setup with SOP), done-for-you vs done-with-you implementation, and how to package and charge for build-outs.

🚀 Why This Video Matters

This is the core of your offer. If your AI agents sound good, ask the right questions, handle objections intelligently, and target the right people with the right script, you don't just "have a platform," you have something clients will gladly pay high-ticket for.

By the end of this video, you'll know:
• How a real, money-making AI outbound agent actually works
• How to measure success (answer → engagement → conversion)
• How to build, tweak and test openers, pitches & objections
• How to adapt everything to your specific niche using the master prompt
• How to pair inbound + outbound agents with shared memory
• How to turn this into a repeatable, scalable fulfillment system for your agency`,
    }),
    L("building-an-agent", "Building an Agent (Step by Step)", {
      video: "https://youtu.be/rAqqIyJDE18",
      durationMin: 16,
      content: `This is the BIG one: this is where you BUILD your first AI agent. 🚀

In this video, you'll see exactly how to set up your first AI agent, step-by-step, and why this step is so critical to your success.

What you'll learn in this video:
✅ How to select your industry-specific AI agent, already fine-tuned for your market (real estate, SDR, solar, etc.)
✅ How to define your AI's role + objectives, so it knows exactly what it's trying to accomplish on every call
✅ How to name and position your AI, critical for building trust on the call
✅ How to configure call settings: inbound, outbound, live transfers, callback handling
✅ How to select AI voice & personality, matching the tone + pace to your target market (older homeowners vs. younger buyers, etc.)
✅ How to set up pipeline & stages, so your AI knows when to call, how often to follow up, and how to move leads intelligently
✅ How to build your first dynamic script, including KYCs, conditions, objections, and natural conversation flow
✅ How to use Advanced Settings: guardrails, personality tuning, response timing, fallback handling
✅ How to leverage the built-in Script Builder, generating powerful scripts with GPT, pre-optimized for your use case
✅ How to organize your agents (ex: inbound vs. outbound agents) for clean data and better tracking
✅ How to integrate with your CRM, so leads flow in and are called instantly`,
    }),
    L("prompt-sales-agents", "Prompt AI Sales Agents Like a Pro", {
      video: "https://www.loom.com/share/9368ec8ed0324acbae80c2f1f819677f",
      durationMin: 14,
      content: `In this session we go deep into the actual architecture behind AI agents and prompting.

Most people treat AI like a black box: they paste prompts and hope it works. But the reality is that high-performing AI agents are built with structured prompting systems.

This workshop breaks down the layers behind effective AI prompting and how to design agents that consistently perform.

Inside this session we cover:

1. The AI Agent Prompt Stack
Learn the layers that power every AI agent:
• Context injection
• Guardrails
• Memory
• Knowledge base
• Tools
• Decision trees
• LLM reasoning
• Output formatting
Understanding this stack helps you design prompts that are predictable and reliable.

2. The Anatomy of a High-Performing Prompt
How prompts are structured inside AssignX:
• Objective (North Star of the agent)
• Guardrails (safety & boundaries)
• Greeting
• Opener
• Pitch
• KYC / Qualification
• Objection handling
• Closing
• Tool calling
When structured correctly, your agent behaves like a trained sales rep.

3. The Millisecond AI Response Loop
What actually happens when someone answers an AI call:
Speech → Transcription → LLM reasoning → Response generation → Voice output
All of this happens in milliseconds during a live conversation.

4. Prompt Symbol System (Advanced Prompting)
We also cover the syntax used inside advanced prompts:
• [ ] → Conditions
• { } → Variables / dynamic data
• " " → Spoken output
• ( ) → Internal instructions to the AI
• # → Prompt sections / structure
Understanding these allows you to build much more powerful agents.

5. Structuring Prompts the Right Way
Why messy prompts fail and how to structure them properly. A clean prompt should always be modular so you can easily swap greeting, opener, pitch, and closing. This makes it possible to optimize agents like marketing campaigns.

6. AI Agent A/B Testing
Your AI agents should be tested just like ads. You can test different versions of greetings, openers, pitches, and closing questions. Then compare conversation duration, opener rate, and booking rate. This allows you to optimize agent performance over time.

7. Real Call Example Breakdown
We analyze a real AI sales call and show how the agent handled objections, mirrored language, built rapport, and navigated skepticism about AI. This shows how powerful structured prompting can be.

8. Using Different AI Models (Including OpenClaw)
We also discuss how different models affect agent performance and when to test alternatives like OpenClaw for deeper reasoning.

Outcome
By the end of this workshop you will understand:
• How AI agents actually think
• How prompts influence behavior
• How to structure prompts for better performance
• How to optimize agents through testing
This knowledge allows you to build significantly more powerful AI agents for your agency and clients.`,
    }),
    L("getting-started", "Getting Started", {
      video: "https://www.loom.com/share/05b727d91c9b4cc984605593c326d344",
      durationMin: 6,
      content: `This is where it starts: building your first AI agent. 🚀

In this quick video, we'll walk you through the first (and most important) step: how to set up your AI agent so it speaks, acts, and performs like the perfect extension of YOU.

You'll learn how to:
✅ Name your AI agent: this is how it will identify itself to prospects & clients
✅ Assign its task: outbound, inbound, or both
✅ Give your agent a role: property acquisition specialist, sales rep, listing specialist, YOU define it
✅ Set your agent's primary objective: circle prospecting, expireds, absentee owners, community updates, or create your own

Pro tip: You can create multiple AI agents, each laser-focused on different objectives, scaling your reach across your entire market.`,
    }),
    L("know-your-customers-kyc", "Know Your Customers (KYC)", {
      video: "https://www.loom.com/share/39d58746cc6a47e0a7100cad7a8add11",
      durationMin: 8,
      content: `Here's where your AI agent gets smart, and starts qualifying like a pro.

In this step, you'll set up KYC (Know Your Customer), so your AI can ask the right questions, understand your leads, and uncover serious opportunities.

✅ For sellers: define questions around NEEDS, MOTIVATION, and URGENCY
✅ For buyers: do the same, so your AI filters the hottest leads, fast
✅ Customizable: add your own questions + sample answers, tailor your AI to your market and sales style

Why this matters: The best agents don't just talk, they QUALIFY. And AI agents that qualify → secure more appointments → drive more deals → outperform the market.`,
    }),
    L("call-script-prompting", "Call Script + Prompting", {
      video: "https://www.loom.com/share/db30512f60154077913d77906d042819",
      durationMin: 12,
      content: `This is one of the MOST important steps, because this is where your AI learns to SELL.

In this video, you'll learn exactly how to build and optimize your AI agent's script, and why getting this step right will make the difference between an AI that simply talks and one that CONSISTENTLY books deals.

Here's what you'll learn in this video:
✅ How to structure a winning script, so your AI sounds natural, professional, and persuasive
✅ How to use variables, for fully personalized conversations (first name, property address, timeline, etc.)
✅ How to insert dynamic KYC questions, so your AI qualifies in REAL conversation, not robotic sequences
✅ How to use conditions & branching, so your AI handles objections, "not interested," market questions, and multiple outcomes naturally
✅ How to set Guardrails, to protect against bad leads or unrealistic expectations
✅ How to inject advanced sales logic, telling the AI how to handle scenarios instead of just scripting word-for-word
✅ How to use the built-in GPT Script Builder, to help you write powerful, optimized scripts in minutes`,
    }),
    L("starting-calls", "Starting Calls (Step by Step)", {
      video: "https://www.loom.com/share/1cc1d92fbc774f82b198b196089b1f2a",
      durationMin: 10,
      content: `How to Start Calling with Your AI Agent (Step-by-Step Walkthrough)

Before your AI can start turning leads into listings, you need to know how to launch your first campaign. In this video, I'll walk you through exactly how to start calling using your lead list, whether you're dialing 50 people or 5,000.

Here's what you'll learn:
✅ How to select your leads and assign them to your AI
✅ How to choose the right AI agent for the campaign (and what happens if it's grayed out)
✅ What "drip calls per day" means, and how to control your daily volume
✅ How to schedule calls for later vs. starting right now
✅ How Smart Refill works, and why it's your AI's lifeline during calling
✅ How to confirm everything's running, and where to track call status in the logs

Whether you're just getting started or running full-scale campaigns, this short video shows you how to confidently launch calls and keep your AI working for you 24/7.`,
    }),
    L("crm-pipeline-stages", "CRM + Pipeline Stages", { durationMin: 9 }),
    L("pausing-resuming-calls", "Pausing & Resuming Calls", {
      video: "https://www.loom.com/share/737fc5282b97495f8b4f0ba2f00e2ab4",
      durationMin: 5,
      content: `How to Pause (and Resume) AI Calls Anytime, Even Mid-Campaign

Launched a calling campaign but need to hit pause? Whether you're calling 50 or 5,000 leads, this video shows you exactly how to pause your AI calls instantly, without losing your progress.

Here's what you'll learn:
✅ How to access your Call Activities tab and see which AI agents are actively calling
✅ How to pause live calling campaigns, in just two clicks
✅ What happens when you pause vs. stop a call campaign
✅ How to resume calls anytime, from the exact same point
✅ How to pause scheduled calls in advance, in case you change the agent, lead list, or timing

Whether you made a mistake, want to adjust timing, or simply need a breather, this quick how-to gives you total control over your outbound AI calls.`,
    }),
    L("using-lead-enrichment", "Using Lead Enrichment", {
      video: "https://www.loom.com/share/64b2dd08d87f440a994efb51d89863d7",
      durationMin: 7,
      content: `What Is Lead Enrichment? (And Why It Gives Your AI a Major Advantage)

Want your AI to sound like it knows your leads instead of guessing? That's exactly what Lead Enrichment does, and in this quick video, I'll break down how it works, what it pulls, and how much it costs.

Here's what you'll learn:
✅ What Lead Enrichment is, and how it gives your AI deeper context
✅ The types of data it gathers, from LinkedIn, YouTube, Instagram, and more
✅ How to use enrichment wisely, whether for 1 or 1,000 leads
✅ How much it costs (just $0.05 per lead), and how to control your spend
✅ Where to see enriched insights, and how to apply them in your conversations

Think of this like an SDR doing research before every call, except now your AI does it instantly. Smarter conversations = better results.`,
    }),
    L("setup-stages-for-ai", "Setup your stages for your AI", {
      video: "https://www.loom.com/share/00560090882c4185bd5f60558252576d",
      durationMin: 8,
      content: `Not every "hot lead" is hot, and your AI needs to know the difference.

In this video, we break down how to configure stages so your AI moves leads based on your definition, not generic rules.

You'll learn:
• How to define what a Hot Lead actually means to you
• How to tell your AI exactly when to move a lead into a stage
• How to use real conversation signals (not guesses)
• How to create custom stages like Not POC and control when they're triggered
• How to prevent duplication and keep pipelines clean

This is how you train your AI to qualify leads the same way you would.`,
    }),
    L("lead-scoring", "Lead Scoring: How Your AI Qualifies Leads", {
      video: "https://www.loom.com/share/9a370d5a36b046dea8a1fcaf6f5ae3df",
      durationMin: 9,
      content: `In this video, you'll learn how to set up lead scoring so your AI can instantly tell you who's worth your time.

We walk through:
• Creating a lead scoring table for an AI agent
• Using industry-specific templates (real estate, insurance, sales, marketing, loan officers)
• Assigning points to key yes/no questions
• Sharing the same scoring logic across multiple agents
• How AI scores leads using direct answers and inferred intent from conversations
• Where to see the final score inside your pipeline

By the end, you'll know exactly why a lead is a 10/10, not just that it is.`,
    }),
    L("custom-pipeline-stages", "Custom Pipeline & Stages", {
      video: "https://www.loom.com/share/01eba81df5c74ac08bf15a8693525bc1",
      durationMin: 8,
      content: `Your AI-Powered Pipeline: Stages, Scoring, and Smart Automation

Your pipeline shouldn't just store leads, it should think for you.

In this walkthrough, you'll see how AssignX pipelines work behind the scenes and how AI agents:
• Segment leads automatically
• Move prospects between stages based on intent and behavior
• Score leads based on confirmed answers (not guesses)
• Surface the most important conversations for you to review
• Handle confirmations, no-shows, and re-engagement

By the end, you'll understand how to structure pipelines that scale, without manual lead babysitting.`,
    }),
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
      {
        video: "https://www.loom.com/share/12f8add8e4744002b1dbf80a397d81f0",
        durationMin: 22,
        content: `The Doc you'll need to access templates: [Click Here](https://docs.google.com/document/d/1AX_4mfUzUa0e4vUPFcCoa5WrwpzP20NRx1pmnqW6z2o/edit?tab=t.uwmoukujteik#heading=h.funw6oubkqp3)

In this workshop, we break down the exact system we use inside AssignX to acquire, convert, and retain users using AI agents and automation.

By the end of this session, you'll understand how to build a fully automated growth engine for your AI agency, from lead generation to onboarding, activation, and retention.

Inside this workshop we cover:

1. Agency Use Pipeline
How to structure your CRM pipeline to track every stage of the customer journey, from new lead → booked → trial → paying user.

2. AI Agent System (3 Core Agents)
You'll learn how to deploy multiple AI agents that work together to move leads through your funnel:
• Lead Qualification Agent
• Booking Confirmation Agent
• No-Show Recovery Agent

3. Facebook Ads → AssignX Automation
How to automatically send leads from Facebook Instant Forms into AssignX using Zapier so your AI agents can immediately start working them.

4. Messaging & Follow-Up Framework
The exact email, SMS, and call cadence we use to convert cold leads into booked workshops and paying users.

5. Psychology of Each Pipeline Stage
Understand what your lead is thinking at each stage and how your messaging should adapt to move them forward.

6. AI-Powered Retention System
How to activate new users quickly using:
• onboarding checklists
• quick wins
• trial conversion strategies
• cancellation recovery flows

7. Scaling to Your First 100 Users
How to combine paid traffic + AI agents + workshops to build predictable user growth.

Outcome:
By the end of this workshop, you'll have the blueprint to launch a fully automated AI agency funnel that can generate leads, qualify them, book calls, and convert them into long-term customers.`,
      },
    ),
    L("21-lead-sources", "21 Lead Sources To Find Clients", {
      video: "https://www.loom.com/share/198a0bcaa16c498f896cc0b954256d43",
      durationMin: 13,
      content: `If you don't have leads, you don't have a business.

In this walkthrough, I break down [21 of the most effective lead sources](https://app.notion.com/p/Lead-Source-Breakdown-32597b2f3bbe80319cf5d9db79e52449?source=copy_link) used by top agencies and demand gen teams, and more importantly, how to actually use them to get results.

We cover everything from:
• Local lead goldmines (Google Maps, Yelp, D7)
• High-intent signals (Indeed job postings)
• Warm audience plays (Facebook Groups, Reddit)
• B2B databases (Apollo, LinkedIn Sales Navigator)
• Niche-specific platforms (Zillow, HomeAdvisor, AgencySpotter)
• Automation tools (Closely, Expandi)

You'll also learn:
• What each source is best used for
• The type of leads you can expect
• When to scrape vs outsource (Fiverr)
• How to actually use the data in your outreach
• The difference between scalable vs slow lead channels

⚠️ Most people get stuck trying to "learn everything." Don't. Pick 1-2 sources, go deep, and start building your pipeline.

Action Step:
Choose one lead source from this list and pull your first 500 leads within the next 24 hours.`,
      resources: [
        {
          id: "lead-source-breakdown",
          label: "Lead Source",
          href: "https://app.notion.com/p/Lead-Source-Breakdown-32597b2f3bbe80319cf5d9db79e52449?source=copy_link",
        },
      ],
    }),
    L(
      "live-ai-workshop",
      "Live AI Workshop (2 Facebook leads to Xbar Closed)",
      {
        video: "https://www.loom.com/share/b36c274067c54eca95301867a3061596",
        durationMin: 35,
        content: `In this training I walk through exactly how to run the AgentX AI workshop and convert attendees into active users during the session.

This workshop format is designed to do three things:
1️⃣ Educate agents on how AI agents can support their business
2️⃣ Show real use cases they can immediately apply
3️⃣ Onboard them live during the call

The goal is not just a demo: it's to get them set up and running their first AI agent before the workshop ends.

What I Cover In The Workshop

1️⃣ Understanding Their Current Business
Start by asking attendees about:
• their market
• how long they've been in real estate
• current lead generation strategies
• whether they use ISAs or cold calling
This helps position the AI agent as a solution to their current bottlenecks.

2️⃣ Explaining the Core Use Cases
We walk through how agents can use AI agents for:
• Expired listings
• FSBO outreach
• Absentee owner prospecting
• Circle prospecting / community updates
• Lead reactivation from their CRM
• Appointment confirmations and follow-ups
The key is helping them understand AI is not replacing them: it's acting as their automated ISA.

3️⃣ Showing Real Call Examples
I play actual AI conversations so attendees can hear:
• how the voice sounds
• how objections are handled
• how appointments get booked
This helps remove skepticism and shows the real-world capability of the AI.

4️⃣ Breaking Down the Technology
We explain the three major components behind the system:
Voice Quality: human-like voice that builds trust and rapport.
Latency & Response Speed: fast responses that keep conversations natural.
Conversation Intelligence: AI that can ask qualifying questions and guide the conversation toward booking an appointment.

5️⃣ Pricing & Plans
We walk attendees through the pricing tiers so they understand how to start:
• $45/month starter plan
• $99/month growth plan
• $249+ higher volume plans
We also explain how minutes and call volume work, and which plan is best depending on their lead volume.

6️⃣ XBar Setup Services
For users who want help implementing everything, we introduce XBar services, where our team:
• Builds their AI sales system
• Sets up scripts and pipelines
• Integrates CRM and calendars
• Configures follow-up sequences
• Optimizes their AI agent strategy
This allows them to launch faster with a fully built system.

7️⃣ Live Onboarding
The most important part of the workshop. Instead of ending with a demo, we walk them through creating their AI agent live:
• creating their account
• selecting their agent objective
• setting call scripts
• connecting calendars
• setting follow-up pipelines
• uploading leads
By the end of the workshop they are ready to start running calls.

Key Strategy For Agency Owners
The workshop works because it follows this flow:
1️⃣ Diagnose their current lead generation problems
2️⃣ Show how AI solves those problems
3️⃣ Demonstrate real conversations
4️⃣ Break down pricing transparently
5️⃣ Onboard users live
This approach turns a simple presentation into a customer acquisition workshop.`,
      },
    ),
    L("demo-launch-client-agents", "How to Demo and Launch Client Agents", {
      video: "https://www.loom.com/share/2dffcbfa60724f9abcb78cc7a159beca",
      durationMin: 12,
      content: `This is how you run demos that convert.

In this session, we take you inside a real AssignX demo with a prospect, walking through the platform step-by-step while navigating real objections, real confusion, and a happy customer.

But more importantly...

💡 What You'll Learn:
• How to structure your demo like a pro
• How to handle billing objections in real-time (without losing trust)
• How to guide prospects through the platform without overwhelming them
• How to reframe confusion into clarity + confidence
• How to position "unexpected value" (like bonus agents) to increase value in the first 10 mins
• How to transition from demo → ownership → activation

🎯 The Real Takeaway:
Anyone can show features. But the partners who win? They know how to control the narrative, remove friction, and leave the prospect feeling taken care of.

By the end of this, you'll understand exactly how to:
👉 Turn a "new user" into a confident user
👉 Turn a demo into a retention moment
👉 Turn a demo call into a retained and happy customer`,
    }),
    L("dental-office-sales-deck", "Dental Office Sales Deck", {
      kind: "text",
      durationMin: 6,
      image: "/decks/dental-office-deck.png",
      imageAlt: "Dental Office with AssignX AI Agents sales deck preview",
      content: `Slide deck: [Open in Gamma](https://gamma.app/docs/Dental-Office-with-AssignX-AI-Agents-3khm8l8q135okpl)

🦷 ASSIGNX AI AGENTS FOR DENTAL CLINICS
Automating Intake, Scheduling & Patient Communication at Scale

Slide 1: Cover Slide
Transform Patient Communication With AssignX AI Dental Agents
24/7 Automated Intake • Scheduling • Follow-Ups • Patient Reactivation

Slide 2: The Reality for Dental Clinics
Modern practices struggle with:
• High call volumes during peak hours
• Missed calls → missed patients
• Staff overwhelmed with admin tasks
• No-shows and late cancellations
• Insurance verification delays
• Outdated manual workflows
• Rising labor costs & staffing shortages
Every missed call is a missed patient with a lifetime value of $3,000-$10,000+.

Slide 3: The Hidden Cost of Missed Calls
• Most clinics miss 35-50% of calls
• 70% of new patient opportunities come from phone
• Patients choose the first clinic that responds
• Staff can only handle 1 call at a time
• After-hours requests = lost revenue
AssignX ensures every patient is answered instantly.

Slide 4: Introducing AssignX AI Dental Agents
AI agents trained specifically for dentists:
• AI Receptionist (Inbound Calls)
• AI Scheduler & Calendar Coordinator
• AI Intake & Medical History Assistant
• AI Recall & No-Show Prevention
• AI Insurance Worksheet Collector
• AI Reactivation Campaigns
• Multi-language agents (English/Spanish)
Your digital front desk team, working 24/7 without breaks.

Slide 5: Why Now?
• Labor shortages across dental industry
• Higher staff turnover
• Patients expect instant communication
• Clinics losing revenue from inconsistent follow-ups
• Automation enables scaling without hiring
• Competition is increasing, speed wins
The clinics that adopt AI first will dominate their local markets.

Slide 6: What Makes AssignX Different
• Human-like voice agents
• Understand dental terminology & case types
• Dynamic scripts for emergencies vs. cleanings vs. cosmetic
• HIPAA-ready infrastructure
• Integrates with dental scheduling systems via Zapier
• Customizable tone, questions, workflows
• Accurate call summaries & patient routing
• Spanish support for bilingual clinics
This is not a chatbot. This is a fully autonomous patient coordination system.

Slide 7: Use Case 1: AI Receptionist (Inbound Calls)
Handles your phone like a trained team member:
• Greets patients
• Identifies call intent
• Books or reschedules appointments
• Handles emergencies
• Provides pricing info (based on your rules)
• Explains procedures
• Gives directions, hours & availability
• Sends intake forms automatically
Never miss a call again.

Slide 8: Use Case 2: Appointment Scheduling & Calendar Management
Your AI agent can:
• Book cleanings, exams, procedures
• Coordinate hygiene schedules
• Match patients with providers
• Reschedule cancelled or missed appointments
• Fill same-day openings
• Manage doctor calendars
Works with Zapier scheduling tools: Google Calendar, Calendly, Acuity Scheduling, Setmore, Square Appointments.
(For clinics with legacy systems, AssignX routes via Zapier + custom workflows.)

Slide 9: Use Case 3: Patient Intake & Medical History Pre-Screening
AI gathers and formats essential info:
• Medical history
• Allergies & medications
• Procedure type
• Pain or emergency symptoms
• Prior dental treatment
• Insurance details
• Contact & DOB
• Availability preferences
Your front desk walks into every appointment fully prepared.

Slide 10: Use Case 4: No-Show & Cancellation Prevention
AI automatically:
• Sends reminders
• Confirms appointments
• Detects intent to cancel
• Offers rescheduling options
• Fills last-minute openings
• Sends instructions (fasting, pre-op, documents)
No-shows reduce by 25-40% with automated agent follow-up.

Slide 11: Use Case 5: Post-Procedure Follow-Ups
AI handles:
• "How are you feeling today?" calls
• Pain check-ins
• Medication reminders
• After-care instructions
• Follow-up appointment scheduling
• Treatment plan reinforcement
Patients feel cared for. Staff workload drops dramatically.

Slide 12: Use Case 6: Insurance Verification Workflow
AI collects:
• Insurance provider
• Member ID
• Group number
• Plan type
• Employer
• Images of insurance cards
• DOB + address mismatch issues
Then passes everything to your team for eligibility checking.

Slide 13: Use Case 7: Patient Reactivation Campaigns
AI reaches out to:
• Patients overdue for cleaning
• Patients with pending treatment plans
• Dormant patients (6-18 months)
• Cosmetic dentistry leads
• Missed inquiry calls
Automatically fills your hygiene schedule with warm patients.

Slide 14: Multi-Channel Patient Engagement
Your AI agent works across:
• Phone
• SMS
• Web chat widget
• Email
The same agent, everywhere.

Slide 15: How AssignX Works
Step 1: Configure Your AI Dental Agent. Define workflows for emergencies, cleanings, ortho, cosmetic, etc.
Step 2: Connect Your Systems via Zapier. AssignX integrates with:
Zapier-Friendly Dental Scheduling & Calendar Apps: Google Calendar, Calendly, Acuity, Setmore, Square Appointments.
Zapier-Friendly Dental CRMs / Tools: HubSpot, Pipedrive, Zoho, monday.com, GoHighLevel, Salesmate, Keap/Infusionsoft, Airtable, Notion, Google Sheets.
Step 3: Train & Personalize the Agent. Tone, scripts, FAQs, after-hours logic.
Step 4: Go Live & Handle Calls Immediately.

Slide 16: Technology & Compliance
• Secure data handling
• Encrypted call logs
• HIPAA-ready infrastructure
• Full audit trails
• Custom disclaimers
• Optional VoIP masking
• Multi-language voice models
• Real-time transcription + case summaries
Your patient data stays protected.

Slide 17: Example Call Flow: New Patient Cleaning & Emergency Dental
• Patient calls with tooth pain
• AI detects "Emergency" intent
• AI follows emergency triage workflow
• Collects symptoms + severity
• Checks schedule
• Books urgent appointment
• Sends SMS confirmation
• Provides directions + pre-visit instructions

"Hi, I'd like to schedule a cleaning."
• AI qualifies: new vs existing, insurance, availability
• Collects insurance details
• Books cleaning with hygienist
• Sends intake links
• Adds to CRM via Zapier
Follow-up reminder sent automatically.

Slide 19: Integrations
AssignX connects easily with:
Scheduling / Calendar Systems: Acuity Scheduling, Calendly, Setmore, Square Appointments, Google Calendar, Microsoft Outlook Calendar.
CRMs / Productivity Systems: HubSpot, Zoho, Pipedrive, GoHighLevel, monday.com, Airtable, Keap, Notion, Slack (internal notifications).
Communication Tools: Twilio, Mailchimp, ActiveCampaign, SendGrid.
Billing / Process Tools: Stripe, QuickBooks.
AssignX fits right into the tools dental clinics are already using.

Slide 21: Case Study (Sample Clinic Performance)
Before AssignX:
• 38% missed calls
• High no-show rate
• Staff overwhelmed
• Hygiene schedule inconsistent
After AssignX:
• 93% reduction in missed calls
• Stable hygiene schedule
• 44% increase in new patient bookings
• Added $18k+ in monthly production
• Staff morale significantly higher

Slide 22: 7-Day Implementation Roadmap
Day 1: Kickoff + Discovery
Day 2: Workflow Mapping (cleanings, emergencies, ortho, cosmetic)
Day 3: Build AI Dental Agent
Day 4: Integrations (Zapier + calendars + CRM)
Day 5: Internal Testing
Day 6: Staff Training + Script Review
Day 7: Go Live + Optimization
Fully deployed in one week.

Slide 23: Why Dental Clinics Choose AssignX
• HIPAA-ready workflows
• 24/7 availability
• High-quality human voice AI
• Customizable to your practice type
• No missed calls
• Immediate ROI
• Refreshingly simple onboarding
• Proven performance in real clinics

Slide 24: The Future of Dental Patient Communication
Every patient answered. Every appointment confirmed. Every schedule filled. Every workflow automated.
This is the new standard for modern dental practices.`,
    }),
    L("law-office-sales-deck", "Law Office Sales Deck", {
      kind: "text",
      durationMin: 6,
      image: "/decks/law-office-deck.png",
      imageAlt: "Transform Your Law Office with AssignX AI Agents sales deck preview",
      content: `Slide deck: [Open in Gamma](https://gamma.app/docs/Transform-Your-Law-Office-with-AssignX-AI-Agents-v4pm59r8m4mtvm1)

📘 AI Agents for Law Offices: AssignX Sales Deck
The Future of Legal Intake, Client Communication & Case Management Automation

Slide 1: Cover Slide
Title: Transform Your Law Office with AssignX AI Agents
Subtitle: Intake, Qualification, Scheduling & Communication, Fully Automated.
Imagery: AssignX logo + legal imagery (scales of justice, courtroom, or modern office)

Slide 2: The Problem: Law Offices Are Overwhelmed
Headline: Law firms lose business every day due to slow, inconsistent communication.
Pain Points:
• Missed calls = missed clients
• Intake forms not filled or poorly qualified
• Staff overwhelmed with repetitive tasks
• Long follow-up times result in clients hiring someone else
• Rising operational costs
• Human receptionist limitations (8 hours, fatigue, absences, turnover)
Impact: 47% of legal clients hire the first attorney who responds. If you don't answer immediately, someone else will.

Slide 3: The Solution: AssignX AI Legal Agents
Headline: Your always-on receptionist, intake specialist, and case qualification expert.
Description: AssignX provides AI-powered voice and chat agents trained specifically for law offices. They handle reception, intake, qualification, scheduling, follow-ups, and case workflows with near-human conversational quality.
Available 24/7. Never misses a call. Never forgets a follow-up.

Slide 4: What Makes AssignX Different
Key Differentiators:
• True Voice AI (not IVR or call menu bots)
• Understands emotions, intent, and nuance
• Custom-trained per law practice (family law, immigration, PI, criminal, etc.)
• Outbound & inbound calling
• Integrates with your CRM / Case Management tools
• Dynamic scripting based on case type
• Enterprise analytics & call summaries
• Fully customizable: tone, compliance, processes, disclaimers
This isn't a chatbot. This is a full digital legal staff member operating at scale.

Slide 5: Use Case 1: AI Receptionist (Inbound Calls)
Handles:
• Greeting callers professionally
• Understanding reason for call (intent detection)
• Determining case type
• Asking compliant qualifying questions
• Booking consultations
• Sending directions / confirmations
• Handling FAQs (fees, process length, hours, documents needed)
Result: Instant client response → higher case acquisition.

Slide 6: Use Case 2: Legal Intake & Discovery
AI agent performs deep qualification, such as:
For Personal Injury:
• Nature of injury
• Date of incident
• Medical treatment
• Liability questions
• Insurance info
• Evidence available
For Family Law:
• Case type (custody, divorce, support, etc.)
• Urgency
• Domestic violence considerations
• Minor children involvement
For Immigration:
• Visa type
• Status
• Deadlines
• Country of origin
• Prior filings
Result: The attorney walks into the first appointment fully informed.

Slide 7: Use Case 3: Outbound Calling & Follow-Ups
AI Agents can automatically:
• Call missed leads within seconds
• Re-engage old cases or cold leads
• Follow up on expiring deadlines
• Reach out to clients needing updates
• Request missing documents
• Chase unpaid invoices
• Remind clients of appointments
100+ calls/hour. No fatigue. No payroll.

Slide 8: Use Case 4: AI Discovery Assistant for Attorneys
Assist with:
• Pre-consultation data gathering
• Client updates
• Witness information
• Documentation collection
• Reviewing and summarizing call transcripts
• Preparing briefs or summaries for paralegals (with proper oversight)
Transforms attorney productivity by removing repetitive admin work.

Slide 9: Use Case: Multi-Channel Support (Phone, SMS, Web Chat)
Your AI agent works across:
• Phone
• SMS
• Website
• Email automation
• Embedded intake forms
Clients get the same experience wherever they engage.

Slide 10: How It Works
Step 1: Configure Your Legal Agent. Upload your intake questions, tone, scripts, disclaimers, and workflows.
Step 2: Connect Your Tools. We integrate with Clio, MyCase, HubSpot, Zoho, Salesforce, Zapier, Make, and more.
Step 3: Launch Voice & SMS Campaigns. Start receiving and sending calls instantly.
Step 4: Review Consultations in Dashboard. Call summaries, case tags, and next steps are all neatly organized.

Slide 11: Technology Under the Hood
• LLM-powered legal conversational modeling
• Real-time voice synthesis (human-like)
• Natural language understanding
• Legal intent detection
• Compliance: disclaimers, privacy, consent flow
• Sentiment analysis
• Secure data handling
• Call transcriptions & auto summaries
• Analytics on conversion, call quality, outcomes

Slide 12: Benefits for Your Law Office
1. Never Miss a Lead: 24/7 coverage so every potential client is captured.
2. Higher Case Acceptance: faster response = competitive edge.
3. Lower Overheads: replace or support costly receptionists.
4. Attorney Productivity Boost: offload repetitive tasks.
5. Better Client Experience: immediate answers and clear guidance.
6. Real-Time Visibility: every call is summarized and logged.

Slide 13: Data Security & Compliance
We follow strict legal-industry standards:
• Encrypted call logs
• Secure client data handling
• Disclaimers for AI use
• No legal advice, only intake & admin
• SOC2 / HIPAA-ready infrastructure
• Full audit trails
• Compliance workflows per case type
Your clients' confidentiality remains protected.

Slide 14: Case Study: Logan's Law Office
(Replace with real KPIs as preferred)
Problem: Logan's firm was missing 27% of inbound calls and losing PI clients to competitors.
Solution: AssignX AI Intake + Reception + Outbound Follow-Up
Results:
• 93% reduction in missed calls
• 2.7x more qualified consultations
• Saved 60+ hours/month for staff
Case Study: https://youtu.be/1BU2aJ_9_Nc

Slide 15: Sample Call Flow (Personal Injury Example)
• Greeting: "Thanks for calling [Firm Name], this is Ava, how can I help you today?"
• Intent Detection: Caller mentions injury → AI switches to PI intake mode
• Qualification: When did it happen? Medical treatment? Fault & liability questions
• Case Assessment: Determines potential case validity
• Scheduling: Books a meeting with the attorney
• Follow-Up: Sends SMS confirmation + required docs list

Slide 16: Pricing & Plans
(You can plug in your actual AssignX pricing model)
Includes:
• Unlimited inbound calls
• Outbound campaigns
• 2-3 AI Legal Agents
• CRM integration
• Call summaries
• Training & onboarding
Add-ons:
• Additional practice areas
• Custom voice personas
• Document workflows
• Advanced analytics
• Bilingual agents (English + Spanish)

Slide 17: Implementation Timeline
Day 1-2: Discovery + Intake Mapping
Day 3-5: Build AI Agent + Scripts
Day 6-7: Integrations
Week 2: Go Live + Optimization
Week 3-4: Scale AI outbound campaigns
Week 4+: Continuous improvement

Slide 18: Why Law Offices Choose AssignX
• Built for serious legal operations
• Proven results in PI, family law, immigration, criminal defense
• Customizable call flows
• Lightning-fast setup
• Enterprise-grade reliability
• Affordable compared to hiring staff
• Designed by operators (not software hobbyists)

Slide 19: The New Standard of Legal Intake
Every client. Every call. Every case. Handled instantly.
Your firm operates at a level no human-only team can match.`,
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
      content: `What each industry uses, buys, and connects, so your AI agent seamlessly fits into their current workflow.

Zapier Integrations: [Click Here](https://zapier.com/apps/assignx/integrations)
Make Integrations: [Click Here](https://www.make.com/en/integrations/myagentx)

🏡 REAL ESTATE AGENTS: Most Common Integrations

CRMs
• Follow Up Boss
• KVCore
• BoomTown
• Sierra Interactive
• RealGeeks
• CINC
• LionDesk
• Chime
• Firepoint

Lead Providers
• REDX
• Vulcan7
• Mojo Dialer
• Vortex (Expireds/FSBOs)
• Zillow Leads
• Realtor.com Leads
• Ylopo
• ZBuyer

Calendars / Booking
• Calendly
• Google Calendar
• GHL Calendar
• Cal.com

Forms / Lead Capture
• Facebook Lead Ads
• Instagram Lead Forms
• Typeform
• Jotform

Automation / Tools
• Zapier
• Make
• Twilio
• Mailchimp
• ActiveCampaign
• CallRail
• AirCall

⚡ SOLAR COMPANIES: Most Common Integrations

CRMs
• GoHighLevel (dominant)
• Salesforce
• Zoho CRM
• Monday.com
• HubSpot

Lead Providers
• SolarExclusive
• ModernMillionaires
• Clean Energy Experts
• SolarReviews
• Instaboost
• Facebook Lead Ads (most common)

Calendars
• Calendly
• GHL Calendar
• Google Calendar

Automation Tools
• Zapier
• Make
• Twilio
• CallRail
• Instantly
• Mailshake
• Slack

⚖️ LAW FIRMS (PI, Injury, Family, Immigration)

CRMs
• Clio
• Litify
• Filevine
• MyCase
• PracticePanther
• Zoho CRM
• HubSpot

Lead Providers
• LegalMatch
• Avvo
• Nolo
• Martindale-Nolo
• Google Ads / LSAs
• Facebook Lead Ads

Calendars
• Calendly
• Google Calendar
• LawConnect

Automation / Tools
• DocuSign
• PandaDoc
• Twilio
• CallRail
• Slack
• Dialpad
• AirCall
• Zapier
• Make

⚕️ MED SPAS: Most Common Integrations

CRMs & Scheduling
• Mindbody
• Booker
• AestheticsPro
• Boulevard
• Fresha
• Vagaro
• Acuity Scheduling
• Calendly
• GHL CRM

Lead Providers
• Facebook Lead Ads
• Groupon (yes, still used heavily)
• Yelp Leads
• SEM/Google Ads

Automation Tools
• Mailchimp
• Klaviyo
• ActiveCampaign
• Zapier
• Make

Other
• Shopify (for e-commerce products)
• Stripe
• Square

🦷 DENTAL CLINICS: Most Common Integrations

Practice Management Systems (most connect via Zapier → Email Parser or API)
• Dentrix
• Eaglesoft
• OpenDental
• Curve Dental

CRMs / Marketing
• PatientPop
• NexHealth
• Weave
• SolutionReach
• GHL CRM

Lead Providers
• 1-800 Dentist
• Google Ads
• Facebook Lead Ads

Calendars
• Google Calendar
• NexHealth Scheduling
• Calendly

Automation Tools
• Zapier
• Make
• Twilio
• CallRail

🛡️ INSURANCE AGENTS (Life, Health, P&C, Commercial)

CRMs
• AgencyZoom
• Velocify
• RadiusBob
• Insureio
• HawkSoft
• Applied Epic
• HubSpot
• Zoho

Lead Providers
• EverQuote
• SmartFinancial
• QuoteWizard
• Facebook Lead Ads
• Google Ads

Calendars
• Calendly
• Google Calendar
• GHL Calendar

Automation Tools
• Zapier
• Make
• Twilio
• CallTrackingMetrics
• ActiveCampaign

🏢 B2B SALES / SaaS / APPOINTMENT SETTERS

CRMs
• HubSpot
• Salesforce
• Close.com
• Pipedrive
• GoHighLevel
• Zoho CRM
• Copper CRM

Lead Sources
• Apollo
• ZoomInfo
• Clay
• LeadFuze
• Cognism
• LinkedIn Lead Gen Forms

Calendars
• Calendly
• Google Calendar
• Cal.com

Outreach Tools
• Instantly
• Lemlist
• Smartlead
• Mailshake
• Outreach.io
• SalesLoft

Automation Tools
• Zapier
• Make
• Twilio
• Slack
• Notion

🏢 RECRUITERS & STAFFING AGENCIES

CRMs / ATS Systems
• Bullhorn
• Greenhouse
• Lever
• BambooHR
• Workable
• JazzHR
• Zoho Recruit

Lead Sources
• LinkedIn Recruiter
• Indeed
• ZipRecruiter
• Apollo (candidate sourcing)

Calendars
• Calendly
• Google Calendar
• Recruitee scheduling

Automation Tools
• Zapier
• Make
• Slack
• Twilio

🔥 The Big Picture

Across ALL niches, these are the integrations that appear most frequently.

Top 10 Universal Integrations
• GHL CRM
• HubSpot
• Salesforce
• Calendly / Cal.com
• Google Calendar
• Facebook Lead Ads
• Zapier
• Make.com
• CallRail / AirCall
• Twilio

These are the "non-negotiable" connections your AI agent should support because they make up 80%+ of what businesses already use.`,
    }),
    L("zapier-mcp", "Zapier MCP", {
      video: "https://youtu.be/i7WVoayn52E?si=82JhkeH_q5B0XN3u",
      durationMin: 9,
      content: `In this video, we break down how to connect Zapier MCP with AssignX to build AI agents that don't just respond, they actually execute actions across your business tools.

Most AI tools today stop at conversation. But with MCP, your AI agent can take real action inside platforms like Gmail, calendars, CRMs, spreadsheets, and more.

Inside this video, you'll learn:
• What MCP is and why it changes everything
• How to connect Zapier MCP to AssignX
• How AI agents can trigger real-world actions automatically
• How to build systems that save time and eliminate manual work
• Real examples of AI agents sending emails, updating deals, booking meetings, and handling workflows

This is the difference between a chatbot and an AI operator.

Once your AI can actually use tools and execute tasks, you stop building "smart assistants" and start building real automation infrastructure.`,
    }),
    L(
      "add-tools-to-ai-agent",
      "How to Add Tools to Your AI Agent (Step by Step)",
      {
        video: "https://www.loom.com/share/d630a4aacf854412a028c917160bb42a",
        durationMin: 14,
        content: `In this video, you'll learn exactly how to connect external tools to your AI agent using Actions and MCP.

We'll walk through:
• Adding tools from scratch
• Connecting platforms like Gmail, Follow Up Boss, calendars, Slack, and Dropbox
• Defining clear tool descriptions so your AI knows what it's allowed to do
• How your AI uses tools in real conversations with prospects and users

By the end, your AI will be able to email, schedule, update records, and execute tasks automatically, all in context.

This is a foundational skill for building powerful, production-ready AI agents.`,
      },
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
