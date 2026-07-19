import type { ReactNode } from "react";
import { Inbox, EyeOff, Filter, Clock } from "lucide-react";

export type EmptyKind = "no-data" | "suppressed" | "filtered" | "coming-soon";

const ICONS: Record<EmptyKind, typeof Inbox> = {
  "no-data": Inbox,
  suppressed: EyeOff,
  filtered: Filter,
  "coming-soon": Clock,
};

const DEFAULTS: Record<EmptyKind, { title: string; subtitle: string }> = {
  "no-data": {
    title: "Nothing recorded for this window",
    subtitle: "Widen the date range or clear filters to see activity.",
  },
  suppressed: {
    title: "Cohort too small to report",
    subtitle: "Widen the filters to see this signal.",
  },
  filtered: {
    title: "No matches for the current filters",
    subtitle: "Remove one or more filters to broaden the view.",
  },
  "coming-soon": {
    title: "Coming next",
    subtitle: "This surface is scaffolded; data lands in a future release.",
  },
};

export function EmptyState({
  kind = "no-data",
  title,
  subtitle,
  action,
  className = "",
}: {
  kind?: EmptyKind;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[kind];
  const d = DEFAULTS[kind];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center gap-3 py-10 px-6 ${className}`}
    >
      <div
        className="w-12 h-12 rounded-full grid place-items-center"
        style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)" }}
      >
        <Icon aria-hidden className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[13.5px] font-medium" style={{ color: "var(--pc-ink)" }}>
          {title ?? d.title}
        </div>
        <div className="mt-1 text-[12px] max-w-sm" style={{ color: "var(--pc-muted)" }}>
          {subtitle ?? d.subtitle}
        </div>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function SuppressedTile({ reason = "k<N", k = 10 }: { reason?: string; k?: number }) {
  void reason;
  return (
    <EmptyState
      kind="suppressed"
      title="Cohort too small to report"
      subtitle={`Fewer than ${k} students in this slice. Widen the filters to see this signal.`}
    />
  );
}
