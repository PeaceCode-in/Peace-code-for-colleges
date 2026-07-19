// SLA status pill. Colour never carries meaning alone — always paired
// with a text label so colour-blind users get the same signal.
export type SlaStatus = "on" | "warn" | "breach";

const TONE: Record<SlaStatus, { fg: string; bg: string; label: string; glyph: string }> = {
  on:     { fg: "var(--pc-good)",    bg: "color-mix(in oklab, var(--pc-good) 14%, var(--pc-surface-2))", label: "On track", glyph: "✓" },
  warn:   { fg: "var(--pc-accent-2)", bg: "color-mix(in oklab, var(--pc-accent-2) 16%, var(--pc-surface-2))", label: "Watch", glyph: "!" },
  breach: { fg: "var(--pc-warn)",    bg: "color-mix(in oklab, var(--pc-warn) 16%, var(--pc-surface-2))", label: "Breach", glyph: "✕" },
};

export function SlaChip({
  status,
  text,
}: {
  status: SlaStatus;
  text: string;
}) {
  const t = TONE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
      style={{ background: t.bg, color: t.fg, border: "1px solid color-mix(in oklab, " + t.fg + " 30%, var(--pc-border))" }}
    >
      <span aria-hidden style={{ fontWeight: 600 }}>{t.glyph}</span>
      <span className="sr-only">{t.label}: </span>
      <span>{text}</span>
    </span>
  );
}
