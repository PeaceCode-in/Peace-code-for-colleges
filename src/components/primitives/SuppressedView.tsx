// Full-page suppression state. Used when a slice as a whole falls below
// the anonymity floor and none of the tiles can be rendered.
import { ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/college/primitives";
import { K_MIN } from "@/lib/cohort-selectors";

export function SuppressedView({
  n,
  onReset,
}: {
  n: number;
  onReset?: () => void;
}) {
  return (
    <GlassCard tone="raised" className="p-10 lg:p-14 flex flex-col items-center text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "color-mix(in oklab, var(--pc-warn) 12%, var(--pc-surface-2))",
          color: "var(--pc-warn)",
          border: "1px solid color-mix(in oklab, var(--pc-warn) 30%, var(--pc-border))",
        }}
      >
        <ShieldAlert className="h-6 w-6" aria-hidden />
      </div>
      <h2
        className="font-serif text-[24px] mt-5 tracking-tight"
        style={{ color: "var(--pc-ink)" }}
      >
        This slice is too small to show
      </h2>
      <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed" style={{ color: "var(--pc-ink-2)" }}>
        The current filters describe a group of <strong>{n}</strong>{" "}
        {n === 1 ? "student" : "students"} — fewer than the k={K_MIN} floor we require before
        showing any number. This isn't a data gap; it's the guardrail that keeps individual
        students unidentifiable.
      </p>
      <p className="mt-3 max-w-lg text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
        Try broadening one filter — for example, switch a specific year back to "All" or expand
        the residency filter — and the aggregates will re-appear as soon as the group crosses k=
        {K_MIN}.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 text-[12.5px] px-4 py-2 rounded-full transition-colors"
          style={{
            background: "color-mix(in oklab, var(--pc-accent) 14%, var(--pc-surface-2))",
            color: "var(--pc-accent)",
            border: "1px solid color-mix(in oklab, var(--pc-accent) 40%, var(--pc-border))",
          }}
        >
          Reset filters
        </button>
      )}
    </GlassCard>
  );
}
