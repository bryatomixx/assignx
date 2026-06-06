"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PhoneCall,
  Globe,
  Megaphone,
  Search,
  Headphones,
  Bot,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const memojis = ["🧔🏻", "👩🏽‍🦱", "🧑🏿‍🦱", "👨🏼‍🦰", "👩🏻", "🧑🏻‍💼"];

const agentTypes = [
  {
    icon: PhoneCall,
    title: "Prospecting Agent",
    desc: "Cold-calls and qualifies your leads on autopilot, then books the call.",
  },
  {
    icon: Globe,
    title: "Website Demo Agent",
    desc: "Lives on your site, greets visitors, and converts them in real time.",
  },
  {
    icon: Megaphone,
    title: "Meta Ads Setter",
    desc: "Turns paid-ad leads into booked appointments the moment they opt in.",
  },
  {
    icon: Search,
    title: "Google PPC Agent",
    desc: "Instantly qualifies inbound PPC leads so none go cold.",
  },
  {
    icon: Headphones,
    title: "Voice Receptionist",
    desc: "Answers and routes inbound calls 24/7 — like a human front desk.",
  },
  {
    icon: Bot,
    title: "Personal AI Assistant",
    desc: "Your own 'Jarvis' — an executive agent that handles the busywork.",
  },
];

const industries = [
  { emoji: "🏠", label: "Real Estate" },
  { emoji: "🛡️", label: "Insurance" },
  { emoji: "💆", label: "Medspa & Clinics" },
  { emoji: "🦷", label: "Dental" },
  { emoji: "🔧", label: "Local Services" },
  { emoji: "🛒", label: "E-commerce" },
];

const weeks = [
  { n: "Week 1", title: "Agency Foundations", desc: "Platform, plans & a full whitelabel." },
  { n: "Week 2", title: "Launch & Pitch", desc: "Live agents and a deck that closes." },
  { n: "Week 3", title: "Marketing & Integrations", desc: "Funnels, ads, Zapier, GHL, MCP." },
  { n: "Week 4", title: "Scale & Launch", desc: "Xbar SOP, fulfillment & go-live." },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Soft brand glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-100 via-brand-50 to-transparent blur-2xl" />

      {/* Top bar */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Link href="/login">
          <Button size="sm">Member login</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-5 pb-16 pt-12 text-center sm:px-8 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-ink-700"
        >
          <Sparkles className="h-4 w-4 text-magenta" />
          AssignX · Agency Partners Academy · Free course
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-5xl leading-[1.05] tracking-[-0.03em] sm:text-7xl"
        >
          Build AI Agents for
          <br />
          <span className="text-gradient-brand">Every Business</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-5 max-w-xl text-lg text-ink-500"
        >
          The free AssignX partner academy. Learn to launch sales, support, and
          voice agents that prospect, book, and close — across any industry.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/classroom/30-day-challenge">
            <Button size="lg">
              Start the free course <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/classroom">
            <Button variant="secondary" size="lg">
              <PlayCircle className="h-4 w-4" /> Browse the curriculum
            </Button>
          </Link>
        </motion.div>

        {/* Memoji row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex items-center justify-center"
        >
          {memojis.map((m, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 16,
                delay: 0.35 + i * 0.06,
              }}
              className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-line first:ml-0"
            >
              {m}
            </motion.span>
          ))}
        </motion.div>
        <p className="mt-3 text-sm text-ink-300">
          Join partners building agent agencies worldwide
        </p>
      </section>

      {/* Use cases — agent types */}
      <section className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <motion.div {...reveal} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
            Use cases
          </p>
          <h2 className="mt-1 text-3xl sm:text-4xl">
            What you&apos;ll learn to build
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-500">
            Six proven agent types you&apos;ll deploy for your own agency and
            your clients.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agentTypes.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                {...reveal}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-line bg-white p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-xl">{a.title}</h3>
                <p className="mt-1.5 text-sm text-ink-500">{a.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Industries */}
      <section className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <motion.div {...reveal} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
            Industries
          </p>
          <h2 className="mt-1 text-3xl sm:text-4xl">Niches you&apos;ll serve</h2>
        </motion.div>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          {industries.map((n, i) => (
            <motion.span
              key={n.label}
              {...reveal}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[15px] font-medium text-ink-700"
            >
              <span className="text-xl">{n.emoji}</span>
              {n.label}
            </motion.span>
          ))}
        </div>
      </section>

      {/* 4-week path */}
      <section className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <motion.div {...reveal} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
            The path
          </p>
          <h2 className="mt-1 text-3xl sm:text-4xl">
            From setup to launch in 4 weeks
          </h2>
        </motion.div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {weeks.map((w, i) => (
            <motion.div
              key={w.n}
              {...reveal}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative rounded-3xl border border-line bg-white p-6"
            >
              <span className="font-display text-4xl font-semibold text-gradient-brand">
                {i + 1}
              </span>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-300">
                {w.n}
              </p>
              <h3 className="mt-1 text-lg">{w.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-5xl px-5 pb-24 pt-8 sm:px-8">
        <motion.div
          {...reveal}
          className="relative overflow-hidden rounded-[32px] px-6 py-16 text-center text-white"
          style={{ backgroundImage: "linear-gradient(135deg,#7802DF,#FF0BD6)" }}
        >
          <h2 className="text-3xl text-white sm:text-4xl">
            Start building your agent agency — free
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Orientation plus 4 weeks of lessons, material, and homework. No cost,
            no catch.
          </p>
          <Link href="/classroom/30-day-challenge" className="mt-7 inline-block">
            <Button variant="secondary" size="lg">
              Start the free course <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
