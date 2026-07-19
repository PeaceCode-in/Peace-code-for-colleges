// Single source of truth for global keyboard shortcuts.

export type Shortcut = {
  keys: string; // display form, e.g. "g o", "?", "/"
  label: string;
  group: "Navigation" | "Global" | "Tables";
  route?: string; // for nav sequences
};

export const SHORTCUTS: Shortcut[] = [
  { keys: "?", label: "Show keyboard shortcuts", group: "Global" },
  { keys: "/", label: "Focus sidebar / filter search", group: "Global" },
  { keys: "Esc", label: "Clear topmost applied filter", group: "Global" },

  { keys: "g o", label: "Go to Executive overview", group: "Navigation", route: "/dashboard" },
  { keys: "g d", label: "Go to Departments", group: "Navigation", route: "/departments" },
  { keys: "g s", label: "Go to Wellbeing signals", group: "Navigation", route: "/signals/wellbeing" },
  { keys: "g e", label: "Go to Early warning & care", group: "Navigation", route: "/care/risk" },
  { keys: "g r", label: "Go to Reports", group: "Navigation", route: "/reports" },
  { keys: "g a", label: "Go to Administration", group: "Navigation", route: "/admin" },

  { keys: "↑ / ↓", label: "Navigate table rows", group: "Tables" },
  { keys: "Enter", label: "Open selected row", group: "Tables" },
  { keys: "Shift+Enter", label: "Add row to comparison", group: "Tables" },
];

export const NAV_SEQUENCES: Record<string, string> = Object.fromEntries(
  SHORTCUTS.filter((s) => s.route && s.keys.startsWith("g ")).map((s) => [
    s.keys.replace(" ", ""),
    s.route!,
  ])
);
