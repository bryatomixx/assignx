"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAcademy } from "@/lib/store/AcademyProvider";

/**
 * "Back to dashboard" link shown at the top of pages reached from the dashboard
 * Quick access. Only rendered for admins (the dashboard is admin-only), so it
 * never points non-admins at a page they cannot open.
 */
export function BackToDashboard() {
  const { currentUser } = useAcademy();
  if (currentUser?.role !== "admin") return null;

  return (
    <Link
      href="/dashboard"
      className="mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-ink-500 transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to dashboard
    </Link>
  );
}
