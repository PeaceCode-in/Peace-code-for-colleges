import type { AdminRole } from "@/lib/admin-mock";
import { ShieldCheck, Eye } from "lucide-react";

export function RoleBadge({ role }: { role: AdminRole }) {
  const isAdmin = role === "admin";
  const Icon = isAdmin ? ShieldCheck : Eye;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
      style={{
        background: isAdmin
          ? "color-mix(in oklab, var(--pc-primary) 14%, var(--pc-surface2))"
          : "var(--pc-surface2)",
        color: isAdmin ? "var(--pc-primary)" : "var(--pc-ink-2)",
        border: "1px solid var(--pc-border)",
      }}
    >
      <Icon className="w-3 h-3" />
      {isAdmin ? "Admin" : "Viewer"}
    </span>
  );
}
