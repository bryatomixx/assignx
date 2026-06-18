"use client";

import { preconnect, prefetchDNS } from "react-dom";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { PausedGate } from "@/components/classroom/PausedGate";

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Warm up connections to the lesson video providers (Loom + YouTube) as soon
  // as the classroom loads, so the first lesson's player loads faster instead
  // of flashing black while it negotiates DNS/TLS. Next 16 hoists these into
  // <head> as resource hints; React dedupes repeated calls.
  preconnect("https://www.loom.com");
  preconnect("https://cdn.loom.com", { crossOrigin: "anonymous" });
  preconnect("https://www.youtube.com");
  preconnect("https://i.ytimg.com", { crossOrigin: "anonymous" });
  prefetchDNS("https://s.ytimg.com");

  const { ready, isPaused } = useAcademy();

  // Paused members lose access to all classroom content.
  if (ready && isPaused()) return <PausedGate />;

  return <>{children}</>;
}
