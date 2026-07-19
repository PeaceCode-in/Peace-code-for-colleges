// Clinically-labeled severity legend. Never colour-only: always paired
// label + swatch. Hover reveals the validated cutoff and a short line
// about the clinical meaning.
import { bandsFor, SCALE_LABEL, type ScaleId } from "@/lib/clinical-scales";

export function ScaleLegend({
  scale,
  activeBand,
  onSelect,
}: {
  scale: ScaleId;
  activeBand?: string;
  onSelect?: (key: string) => void;
}) {
  const bands = bandsFor(scale);
  return (
    <div
      role="group"
      aria-label={`${SCALE_LABEL[scale]} severity legend`}
      className="flex flex-wrap items-center gap-1.5"
    >
      {bands.map((b) => {
        const active = activeBand && activeBand !== "all" ? activeBand === b.key : true;
        const chip = (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: active
                ? "color-mix(in oklab, var(--pc-surface2) 90%, transparent)"
                : "transparent",
              color: active ? "var(--pc-ink-2)" : "var(--pc-muted)",
              border: "1px solid var(--pc-border)",
              opacity: active ? 1 : 0.55,
            }}
          >
            <span
              aria-hidden
              className="w-2 h-2 rounded-sm"
              style={{ background: b.color, border: "1px solid color-mix(in oklab, var(--pc-ink) 8%, transparent)" }}
            />
            <span>{b.label}</span>
            <span style={{ color: "var(--pc-muted)" }}>
              {b.min}–{b.max}
            </span>
          </span>
        );
        return onSelect ? (
          <button
            key={b.key}
            type="button"
            onClick={() => onSelect(activeBand === b.key ? "all" : b.key)}
            title={b.description}
            className="focus:outline-none focus:ring-2 rounded-full"
            style={{ outlineOffset: 2 }}
            aria-pressed={activeBand === b.key}
          >
            {chip}
          </button>
        ) : (
          <span key={b.key} title={b.description}>
            {chip}
          </span>
        );
      })}
    </div>
  );
}
