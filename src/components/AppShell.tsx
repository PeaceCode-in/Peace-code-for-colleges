// Minimal shell for PeaceCode for Colleges.
// Owns the appearance/accessibility applier so every child page inherits
// the live theme tokens. The institutional sidebar / nav will be layered
// on top of this later — for now it's a plain passthrough that guarantees
// the design system is initialised.
import { useEffect, type ReactNode } from "react";
import { loadSettings, applyAppearance, applyAccessibility } from "@/lib/settings-store";
import { GlassFX } from "@/components/GlassFX";

// ─── Themeable palette — every value is a CSS variable so light/dark ────
// can be swapped globally by toggling `.dark` on <html>. Tokens live in
// styles.css under `:root` and `.dark, [data-theme="dark"]`.
export const palette = {
  bg:       "var(--pc-bg)",
  surface:  "var(--pc-surface)",
  surface2: "var(--pc-surface2)",
  border:   "var(--pc-border)",
  ink:      "var(--pc-ink)",
  muted:    "var(--pc-muted)",
  primary:  "var(--pc-primary)",
  soft:     "var(--pc-soft)",
  lavender: "var(--pc-lavender)",
};

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const s = loadSettings();
    applyAppearance(s);
    applyAccessibility(s);
  }, []);
  return (
    <div className="min-h-screen" style={{ background: palette.bg, color: palette.ink }}>
      <GlassFX />
      {children}
    </div>
  );
}
