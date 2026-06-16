"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/community/NotificationBell";
import { useAcademy } from "@/lib/store/AcademyProvider";

// Routes that do NOT require authentication.
const PUBLIC_ROUTES = ["/login"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

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

// Global auth guard: redirects unauthenticated users from protected routes.
// Shows a spinner while auth resolves so protected content never flashes.
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authLoading, currentUser } = useAcademy();

  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!authLoading && !currentUser && !isPublic) {
      router.push("/login");
    }
  }, [authLoading, currentUser, isPublic, router]);

  // On protected routes: show spinner until auth is resolved.
  if (!isPublic && authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
      </div>
    );
  }

  // On protected routes: hide content while redirect is pending (no flash).
  if (!isPublic && !authLoading && !currentUser) {
    return null;
  }

  return <>{children}</>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname === "/" || pathname === "/login";

  if (isFullBleed) {
    return (
      <AuthGate>
        <main className="min-h-screen">{children}</main>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          {/* Bell row: visible on all interior pages, right-aligned */}
          <TopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
