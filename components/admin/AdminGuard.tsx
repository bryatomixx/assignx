"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";

/** Demo-only role gate. In production this is enforced server-side. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { ready, currentUser, users, setCurrentUser } = useAcademy();

  if (!ready || !currentUser)
    return <div className="p-8 text-ink-300">Loading…</div>;

  if (currentUser.role !== "admin") {
    const admin = users.find((u) => u.role === "admin");
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
          <h1 className="mt-4 text-xl">Admins only</h1>
          <p className="mt-2 text-sm text-ink-500">
            You&apos;re signed in as a student. Switch to the admin account to
            manage partners.
          </p>
          {admin && (
            <button
              onClick={() => setCurrentUser(admin.id)}
              className="mt-5 inline-flex items-center justify-center rounded-[9px] gradient-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Switch to {admin.name}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
