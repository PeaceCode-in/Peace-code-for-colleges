// Foundational primitives for every PeaceCode for Colleges surface.
// Read only --pc-* tokens; honour dark mode, density, and reduce-motion
// automatically through the design-system attributes on <html>.
import { type ReactNode } from "react";

// ─── GlassCard ──────────────────────────────────────────────────
export function GlassCard({
  tone = "default",
  className = "",
  style,
  children,
}: {
  tone?: "default" | "outlined" | "raised";
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const base: React.CSSProperties = {
    background: "var(--pc-surface)",
    color: "var(--pc-ink)",
    borderRadius: "var(--pc-radius-scale, 16px)",
    border:
      tone === "outlined"
        ? "1.5px solid var(--pc-border)"
        : "1px solid var(--pc-border)",
    boxShadow:
      tone === "raised"
        ? "0 12px 32px -18px color-mix(in oklab, var(--pc-ink) 30%, transparent)"
        : "none",
  };
  return (
    <div className={className} style={{ ...base, ...style }}>
      {children}
    </div>
  );
}

// ─── PageHeader ─────────────────────────────────────────────────
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className="pb-4 mb-5"
      style={{ borderBottom: "1px solid var(--pc-border)" }}
    >
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          {/* Eyebrow intentionally hidden — the shell already renders a breadcrumb trail above the page header. */}
          <h1
            className="font-serif text-[clamp(1.6rem,3.4vw,2.25rem)] leading-[1.1] tracking-tight"
            style={{ color: "var(--pc-ink)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-2 text-[13.5px] max-w-2xl"
              style={{ color: "var(--pc-muted)", fontFamily: "var(--font-sans)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

// ─── StatTile ───────────────────────────────────────────────────
export function StatTile({
  label,
  value,
  delta,
  trend,
}: {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
}) {
  const trendColor =
    trend === "up"
      ? "var(--pc-good)"
      : trend === "down"
        ? "var(--pc-warn)"
        : "var(--pc-muted)";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  return (
    <GlassCard className="p-5">
      <div
        className="text-[10.5px] uppercase"
        style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}
      >
        {label}
      </div>
      <div
        className="font-serif text-[28px] leading-[1.1] mt-2"
        style={{ color: "var(--pc-ink)" }}
      >
        {value}
      </div>
      {delta && (
        <div className="mt-2 text-[12px] flex items-center gap-1" style={{ color: trendColor }}>
          <span aria-hidden>{arrow}</span> <span>{delta}</span>
        </div>
      )}
    </GlassCard>
  );
}

// ─── AnonymityBadge ─────────────────────────────────────────────
// The k-anonymity guardrail. Every future data component MUST render this
// before showing a number. Under k=5, the number is redacted.
export function AnonymityBadge({ n, k = 5 }: { n: number; k?: number }) {
  const safe = n >= k;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
      style={{
        background: safe ? "var(--pc-surface2)" : "color-mix(in oklab, var(--pc-warn) 12%, var(--pc-surface2))",
        color: safe ? "var(--pc-ink-2)" : "var(--pc-warn)",
        border: "1px solid var(--pc-border)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: safe ? "var(--pc-good)" : "var(--pc-warn)" }}
      />
      {safe ? `n = ${n} students` : `Hidden — cohort below k=${k}`}
    </span>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────
export function EmptyState({
  illustration = "parchment",
  title,
  description,
  action,
}: {
  illustration?: "parchment" | "chart";
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <GlassCard className="p-10 flex flex-col items-center text-center">
      <PlainIllustration variant={illustration} />
      <h2
        className="font-serif text-[22px] mt-6"
        style={{ color: "var(--pc-ink)" }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-md text-[13px]" style={{ color: "var(--pc-muted)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </GlassCard>
  );
}

function PlainIllustration({ variant }: { variant: "parchment" | "chart" }) {
  const stroke = "var(--pc-border)";
  const ink = "var(--pc-ink-2)";
  if (variant === "chart") {
    return (
      <svg width="96" height="72" viewBox="0 0 96 72" fill="none" aria-hidden>
        <rect x="1" y="1" width="94" height="70" rx="10" stroke={stroke} />
        <path d="M12 54 L30 40 L46 46 L64 24 L84 32" stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="30" cy="40" r="2" fill={ink} />
        <circle cx="46" cy="46" r="2" fill={ink} />
        <circle cx="64" cy="24" r="2" fill={ink} />
      </svg>
    );
  }
  return (
    <svg width="88" height="96" viewBox="0 0 88 96" fill="none" aria-hidden>
      <path d="M10 6 H70 L80 16 V90 H10 Z" stroke={stroke} strokeWidth="1.5" fill="none" />
      <path d="M70 6 V16 H80" stroke={stroke} strokeWidth="1.5" fill="none" />
      <line x1="20" y1="34" x2="66" y2="34" stroke={ink} strokeWidth="1" />
      <line x1="20" y1="46" x2="66" y2="46" stroke={ink} strokeWidth="1" />
      <line x1="20" y1="58" x2="52" y2="58" stroke={ink} strokeWidth="1" />
      <line x1="20" y1="70" x2="60" y2="70" stroke={ink} strokeWidth="1" />
    </svg>
  );
}

// ─── ComingNext ─────────────────────────────────────────────────
// The styled placeholder every not-yet-built route renders.
export function ComingNext({
  promptNumber,
  title,
  whatItWillShow,
}: {
  promptNumber: number;
  title: string;
  whatItWillShow: string;
}) {
  return (
    <GlassCard tone="raised" className="p-8 lg:p-10">
      <div
        className="font-serif italic text-[13px] mb-2"
        style={{ color: "var(--pc-accent-2)" }}
      >
        Prompt {promptNumber}
      </div>
      <h2
        className="font-serif text-[clamp(1.5rem,3vw,2rem)] leading-[1.15] tracking-tight"
        style={{ color: "var(--pc-ink)" }}
      >
        {title}
      </h2>
      <p
        className="mt-3 max-w-2xl text-[14px] leading-relaxed"
        style={{ color: "var(--pc-ink-2)" }}
      >
        {whatItWillShow}
      </p>
      <div className="mt-6">
        <span
          className="inline-flex items-center gap-2 text-[11.5px] px-3 py-1.5 rounded-full"
          style={{
            background: "color-mix(in oklab, var(--pc-primary) 12%, var(--pc-surface2))",
            color: "var(--pc-primary)",
            border: "1px solid color-mix(in oklab, var(--pc-primary) 25%, var(--pc-border))",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--pc-primary)" }} />
          In construction — data pipeline arrives with Prompt {promptNumber}
        </span>
      </div>
    </GlassCard>
  );
}
