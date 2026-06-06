"use client";

import { useAcademy } from "@/lib/store/AcademyProvider";
import { PausedGate } from "@/components/classroom/PausedGate";

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, isPaused } = useAcademy();

  // Paused members lose access to all classroom content.
  if (ready && isPaused()) return <PausedGate />;

  return <>{children}</>;
}
