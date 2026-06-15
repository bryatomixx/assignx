import { Crown, Shield } from "lucide-react";
import type { CommunityRole } from "@/lib/types";

export function RoleBadge({ role }: { role: CommunityRole }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        <Crown className="h-3 w-3" />
        Admin
      </span>
    );
  }
  if (role === "mod") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
        <Shield className="h-3 w-3" />
        Mod
      </span>
    );
  }
  return null;
}
