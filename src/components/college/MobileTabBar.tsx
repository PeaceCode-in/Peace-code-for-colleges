import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Building2, HeartPulse, AlertTriangle, FileText } from "lucide-react";

const TABS = [
  { url: "/dashboard",         label: "Home",     icon: Sparkles },
  { url: "/departments",       label: "Depts",    icon: Building2 },
  { url: "/signals/wellbeing", label: "Signals",  icon: HeartPulse },
  { url: "/care/risk",         label: "Care",     icon: AlertTriangle },
  { url: "/reports",           label: "Reports",  icon: FileText },
];

/**
 * MobileTabBar — app-like bottom navigation for mobile viewports.
 * Hidden on md+ where the sidebar takes over.
 */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary"
      className="pc-mobile-tabbar md:hidden fixed bottom-0 inset-x-0 z-40"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname === t.url || pathname.startsWith(t.url + "/");
          const Icon = t.icon;
          return (
            <li key={t.url}>
              <Link
                to={t.url}
                aria-current={active ? "page" : undefined}
                className="pc-mobile-tab flex flex-col items-center justify-center gap-1 py-2 min-h-[52px]"
                data-active={active ? "true" : "false"}
              >
                <span className="pc-mobile-tab-ico grid place-items-center h-6 w-6">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[10.5px] leading-none">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
