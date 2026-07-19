// Shared design tokens for community pages.
// Wired to the universal theme engine (html[data-pc-bg]) so every page
// follows the currently selected appearance instead of hardcoded hexes.
export const cmy = {
  bg: "var(--pc-bg)",
  surface: "color-mix(in oklab, var(--pc-ink) 6%, transparent)",
  surface2: "color-mix(in oklab, var(--pc-ink) 10%, transparent)",
  border: "color-mix(in oklab, var(--pc-ink) 14%, transparent)",
  ink: "var(--pc-ink)",
  muted: "var(--pc-muted)",
  primary: "var(--pc-primary)",
  // Accent tints derived from primary so they shift with the theme
  lavender: "color-mix(in oklab, var(--pc-primary) 35%, transparent)",
  sky: "color-mix(in oklab, var(--pc-primary) 25%, transparent)",
  rose: "color-mix(in oklab, var(--pc-primary) 20%, #f8cada 20%)",
  mint: "color-mix(in oklab, var(--pc-primary) 20%, #cdebd9 20%)",
};
