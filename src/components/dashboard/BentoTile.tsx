// Universal tile wrapper for the executive dashboard. Composes from
// var(--pc-*) tokens and reads `data-card-style` + `data-glass` + the
// active corner-radius from the html attributes the appearance applier
// sets. No colour is hardcoded — every fill and border resolves through
// the design-system tokens so accent, theme, and presets flow through.
import { type ReactNode, useId } from "react";
import { Link } from "@tanstack/react-router";
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
}) {
  const auto = useId();
  const hid = headingId ?? `bt-${auto}`;
  // Fallback for the rare SSR path where the appearance attrs aren't set.
  const s = typeof window !== "undefined" ? loadSettings() : null;
  const reduce = s?.appearance.reduceMotion || s?.accessibility.reduceAnim;

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
    transition: reduce ? "none" : "transform 220ms ease, box-shadow 220ms ease",
  };
  const cls =
    `pc-glass-card flex flex-col min-w-0 ${hoverable ? "hover:-translate-y-0.5" : ""} ${className}`;

  const body = (
    <>
      {(eyebrow || title) && (
        <header className="mb-3 min-w-0">
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
  return (
    <section role="group" aria-labelledby={hid} className={cls} style={shell}>
      {body}
    </section>
  );
}
