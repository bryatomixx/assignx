"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser, overallPct, resetDemo, ready } =
    useAcademy();

  if (!ready || !currentUser) return <aside className="w-[264px] shrink-0" />;

  const nav = [
    { href: "/classroom", label: "Classroom", icon: GraduationCap },
    { href: "/community", label: "Community", icon: Users2 },
    // Admin panel is only linked for admins (mods moderate from /community/moderation)
    ...(currentUser.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
      <Link href="/" className="px-2">
        <Logo />
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                active
                  ? "text-brand-500"
                  : "text-ink-500 hover:bg-surface-2 hover:text-ink-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-brand-50"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-[18px] w-[18px]" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {/* Overall progress */}
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-magenta" />
            Your progress
          </div>
          <ProgressBar pct={overallPct()} showLabel />
        </div>

        {/* Current user + demo role switcher */}
        <div className="rounded-2xl border border-line p-3">
          <div className="flex items-center gap-3">
            <Avatar emoji={currentUser.avatar} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink-900">
                {currentUser.name}
              </div>
              <div className="text-xs capitalize text-ink-300">
                {currentUser.role}
              </div>
            </div>
          </div>

          <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-ink-300">
            Demo · switch user
          </label>
          <select
            value={currentUser.id}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink-700 outline-none focus:border-brand-300"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role}
              </option>
            ))}
          </select>

          <button
            onClick={resetDemo}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:bg-surface-2 hover:text-ink-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo
          </button>
        </div>
      </div>
    </aside>
  );
}
