// Universal tile wrapper for the executive dashboard. Composes from
// var(--pc-*) tokens and reads `data-card-style` + `data-glass` + the
// active corner-radius from the html attributes the appearance applier
// sets. No colour is hardcoded — every fill and border resolves through
// the design-system tokens so accent, theme, and presets flow through.
//
// A tile can be given `onExpand` to become a fully interactive card:
// clicking anywhere on the surface (or pressing Enter/Space) fires
// the callback so the dashboard can open a rich detail sheet. A small
// "Expand" affordance is rendered top-right so the interaction is
// discoverable — with a tooltip explaining the drill-down.
import { type ReactNode, type KeyboardEvent, useId } from "react";
import { Link } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";
import { loadSettings } from "@/lib/settings-store";

type Tone = "default" | "danger";

export function BentoTile({
  title,
  eyebrow,
  headingId,
  className = "",
  children,
  footer,
  tone = "default",
  hoverable = false,
  to,
  onExpand,
  expandLabel = "Open details",
}: {
  title?: string;
  eyebrow?: string;
  headingId?: string;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
  tone?: Tone;
  hoverable?: boolean;
  to?: string;
  onExpand?: () => void;
  expandLabel?: string;
}) {
  const auto = useId();
  const hid = headingId ?? `bt-${auto}`;
  // Fallback for the rare SSR path where the appearance attrs aren't set.
  const s = typeof window !== "undefined" ? loadSettings() : null;
  const reduce = s?.appearance.reduceMotion || s?.accessibility.reduceAnim;
  const interactive = Boolean(onExpand || to || hoverable);

  const shell: React.CSSProperties = {
    background: "var(--pc-surface)",
    color: "var(--pc-ink)",
    borderRadius: "var(--pc-radius-scale, 1rem)",
    border: "1px solid var(--pc-border)",
    borderLeft:
      tone === "danger"
        ? "3px solid var(--pc-danger)"
        : "1px solid var(--pc-border)",
    padding: "calc(var(--pc-density, 1) * 1.15rem)",
    transition: reduce ? "none" : "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
    cursor: onExpand || to ? "pointer" : undefined,
    position: "relative",
  };
  const cls =
    `pc-glass-card flex flex-col min-w-0 group ${interactive ? "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--pc-accent)_45%,transparent)]" : ""} ${className}`;

  const expandAffordance = onExpand ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onExpand();
      }}
      aria-label={expandLabel}
      title={expandLabel}
      className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-opacity"
      style={{
        background: "color-mix(in oklab, var(--pc-surface2) 92%, transparent)",
        border: "1px solid var(--pc-border)",
        color: "var(--pc-ink-2)",
      }}
    >
      <Maximize2 className="w-3 h-3" aria-hidden />
      <span className="hidden sm:inline">Expand</span>
    </button>
  ) : null;

  const body = (
    <>
      {expandAffordance}
      {(eyebrow || title) && (
        <header className="mb-3 min-w-0 pr-16">
          {eyebrow && (
            <div
              className="text-[10px] uppercase mb-1 truncate"
              style={{
                letterSpacing: "0.14em",
                color: "var(--pc-muted)",
                fontFamily: "var(--font-serif)",
              }}
            >
              {eyebrow}
            </div>
          )}
          {title && (
            <h2
              id={hid}
              className="font-serif text-[15px] leading-[1.15] truncate"
              style={{ color: "var(--pc-ink)" }}
            >
              {title}
            </h2>
          )}
        </header>
      )}
      <div className="flex-1 min-h-0">{children}</div>
      {footer && (
        <div
          className="mt-3 pt-3 text-[10.5px]"
          style={{ borderTop: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}
        >
          {footer}
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        role="group"
        aria-labelledby={hid}
        className={cls}
        style={shell}
      >
        {body}
      </Link>
    );
  }

  if (onExpand) {
    const onKey = (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onExpand();
      }
    };
    return (
      <section
        role="button"
        tabIndex={0}
        aria-labelledby={hid}
        aria-haspopup="dialog"
        onClick={onExpand}
        onKeyDown={onKey}
        className={`${cls} focus-visible:outline-none focus-visible:ring-2`}
        style={{ ...shell, ["--tw-ring-color" as any]: "var(--pc-accent)" }}
      >
        {body}
      </section>
    );
  }

  return (
    <section role="group" aria-labelledby={hid} className={cls} style={shell}>
      {body}
    </section>
  );
}
