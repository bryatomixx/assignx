"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/community/NotificationBell";
import { useAcademy } from "@/lib/store/AcademyProvider";

// Renders the bell only after client hydration so hooks
// that read localStorage never run on the server.
function TopBar() {
  const { currentUser, ready } = useAcademy();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !ready || !currentUser) return null;

  return (
    <div className="flex items-center justify-end px-4 pt-4 pb-0">
      <NotificationBell />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname === "/" || pathname === "/login";

  if (isFullBleed) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        {/* Bell row: visible on all interior pages, right-aligned */}
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
