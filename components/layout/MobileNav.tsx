"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Users2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser, ready } = useAcademy();

  const nav = [
    { href: "/classroom", label: "Classroom", icon: GraduationCap },
    { href: "/community", label: "Community", icon: Users2 },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/">
        <Logo />
      </Link>
      <nav className="flex items-center gap-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                active ? "bg-brand-50 text-brand-500" : "text-ink-500",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {ready && currentUser && <Avatar emoji={currentUser.avatar} size="sm" />}
      </nav>
    </header>
  );
}
