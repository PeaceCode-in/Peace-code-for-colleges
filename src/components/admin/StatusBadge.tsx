import type { MemberStatus } from "@/lib/admin-mock";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const CFG: Record<MemberStatus, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  active:   { label: "Active",   color: "var(--pc-good)", Icon: CheckCircle2 },
  invited:  { label: "Invited",  color: "var(--pc-muted)", Icon: Clock },
  disabled: { label: "Disabled", color: "var(--pc-warn)", Icon: XCircle },
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const { label, color, Icon } = CFG[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
      style={{
        background: "var(--pc-surface2)",
        color,
        border: "1px solid var(--pc-border)",
      }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
