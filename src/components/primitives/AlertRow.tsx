// Signal-feed row: icon + headline + sub-copy + tiny sparkline + deep link.
// Never renders individual-student identifiers.
import { AlertTriangle, Eye, Info } from "lucide-react";

export type AlertSeverity = "info" | "attention" | "watch";

const ICONS: Record<AlertSeverity, React.ComponentType<{ className?: string }>> = {
  info: Info,
  attention: AlertTriangle,
  watch: Eye,
};
const TONE: Record<AlertSeverity, string> = {
  info: "var(--pc-good)",
  attention: "var(--pc-warn)",
  watch: "var(--pc-accent-2)",
};
const TONE_LABEL: Record<AlertSeverity, string> = {
  info: "Informational",
  attention: "Attention",
  watch: "Watch",
};

export function AlertRow({
  severity,
  headline,
  sub,
  sparkline,
  onOpen,
}: {
  severity: AlertSeverity;
  headline: string;
  sub: string;
  sparkline: number[];
  onOpen: () => void;
}) {
  const Icon = ICONS[severity];
  const tone = TONE[severity];
  // Normalize sparkline to 40 × 16 SVG.
  const w = 60, h = 18;
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const pts = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-lg p-3 flex items-start gap-3 focus:outline-none focus:ring-2"
      style={{
        background: "color-mix(in oklab, var(--pc-surface) 92%, transparent)",
        border: "1px solid var(--pc-border)",
        outlineColor: "var(--pc-accent)",
      }}
      aria-label={`${TONE_LABEL[severity]} · ${headline}`}
    >
      <div
        className="w-8 h-8 rounded-full grid place-items-center shrink-0"
        style={{
          background: "color-mix(in oklab, " + tone + " 12%, var(--pc-surface2))",
          color: tone,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] leading-snug" style={{ color: "var(--pc-ink)" }}>
          {headline}
        </div>
        <div className="mt-1 text-[11.5px] leading-snug" style={{ color: "var(--pc-muted)" }}>
          {sub}
        </div>
      </div>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="shrink-0 mt-1"
        aria-hidden
      >
        <polyline
          points={pts}
          fill="none"
          stroke={tone}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
