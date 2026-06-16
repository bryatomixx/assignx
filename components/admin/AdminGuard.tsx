"use client";

// Next.js 16 App Router: useRouter from 'next/navigation'.
// AdminGuard: redirects unauthenticated users to /login, shows "Not authorized"
// for non-admin authenticated users. Replaces the old demo "Switch to admin" button.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authLoading, ready, currentUser } = useAcademy();

  // Redirect unauthenticated users to login once auth state resolves.
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [authLoading, currentUser, router]);

  // While auth state is loading, show a spinner -- never flash protected content.
  if (authLoading || !ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
      </div>
    );
  }

  // Not signed in (redirect in progress, render null to avoid flash).
  if (!currentUser) return null;

  // Signed in but not admin.
  if (currentUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-line bg-white p-8"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <ShieldAlert className="h-7 w-7 text-brand-500" />
          </span>
          <h1 className="mt-4 text-xl">Not authorized</h1>
          <p className="mt-2 text-sm text-ink-500">
            This area is restricted to administrators. If you believe this is an
            error, contact your administrator.
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
