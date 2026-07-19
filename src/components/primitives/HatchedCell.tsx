// A single cross-tab cell that has been suppressed by the anonymity floor.
// Renders as a diagonal-hatch pattern with an accessible label — never a
// number.
import { K_MIN } from "@/lib/cohort-selectors";

export function HatchedCell({
  title,
  className = "",
  style,
}: {
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="img"
      aria-label={`Hidden — fewer than ${K_MIN} students in this cell`}
      title={title ?? `Hidden — fewer than ${K_MIN} students`}
      className={className}
      style={{
        background:
          "repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in oklab, var(--pc-border) 80%, transparent) 4px 5px)",
        border: "1px dashed var(--pc-border)",
        borderRadius: 6,
        ...style,
      }}
    />
  );
}
