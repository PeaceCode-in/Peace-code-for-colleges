import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Moon, Sun, User, Keyboard, CornerDownLeft } from "lucide-react";
import { SIDEBAR_GROUPS } from "@/components/college/AppSidebar";

import {
  SidebarProvider, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/college/AppSidebar";
import { GlassFX } from "@/components/GlassFX";
import { loadSettings, saveSettings, applyAppearance, applyAccessibility } from "@/lib/settings-store";
import { useCollegeContext } from "@/lib/college-context";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { KeyboardHelpDialog } from "@/components/keyboard/KeyboardHelpDialog";
import { SeedModePill } from "@/components/college/SeedModePill";
import { PageTransition } from "@/components/motion/PageTransition";
import { NotificationsBell } from "@/components/college/NotificationsBell";
import { ProfileMenu } from "@/components/college/ProfileMenu";
import { BrandLockup } from "@/components/college/BrandMark";
import { MobileTabBar } from "@/components/college/MobileTabBar";

// Human labels for breadcrumb segments. Fallback: title-case the slug.
const LABELS: Record<string, string> = {
  dashboard: "Executive overview",
  departments: "Departments",
  cohorts: "Cohort insights",
  year: "Year & program",
  demographics: "Demographics",
  compare: "Compare cohorts",
  signals: "Wellbeing signals",
  mood: "Mood trends",
  screenings: "Screening outcomes",
  engagement: "Engagement rhythm",
  heatmap: "Wellness heatmap",
  care: "Early warning & care",
  risk: "Risk signals",
  referrals: "Referral pipeline",
  capacity: "Counsellor capacity",
  reports: "Institutional reporting",
  term: "Term reports",
  exports: "Data exports",
  benchmarks: "Peer benchmarks",
  admin: "Administration",
  access: "Access & roles",
  audit: "Audit log",
  settings: "Settings",
  appearance: "Appearance",
};

function labelFor(seg: string): string {
  return LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function useDark(): [boolean, () => void] {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const s = loadSettings();
    setDark(s.appearance.theme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark")));
  }, []);
  const toggle = () => {
    const s = loadSettings();
    const next = s.appearance.theme === "dark" ? "light" : "dark";
    saveSettings({ ...s, appearance: { ...s.appearance, theme: next } });
    setDark(next === "dark");
  };
  return [dark, toggle];
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  return (
    <nav
      className="flex items-center gap-1.5 text-[10.5px] uppercase mb-5"
      style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
      aria-label="Breadcrumb"
    >
      {segs.map((s, i) => {
        const last = i === segs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            <span style={{ color: last ? "var(--pc-ink)" : "var(--pc-muted)" }}>{labelFor(s)}</span>
          </span>
        );
      })}
    </nav>
  );
}

type CmdItem = { title: string; group: string; url: string; icon: React.ComponentType<{ className?: string }>; keywords: string };

function useCommandItems(): CmdItem[] {
  return useMemo(() => {
    const items: CmdItem[] = [];
    for (const g of SIDEBAR_GROUPS) {
      for (const it of g.items) {
        items.push({
          title: it.title,
          group: g.label,
          url: it.url,
          icon: it.icon,
          keywords: `${it.title} ${g.label} ${it.url}`.toLowerCase(),
        });
      }
    }
    return items;
  }, []);
}

function CommandK() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const items = useCommandItems();
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    const tokens = s.split(/\s+/);
    return items.filter((it) => tokens.every((t) => it.keywords.includes(t)));
  }, [q, items]);

  useEffect(() => { setActive(0); }, [q, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) { setQ(""); return; }
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (url: string) => {
    setOpen(false);
    navigate({ to: url });
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const r = results[active]; if (r) go(r.url); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 w-[340px] max-w-[42vw] px-3 py-1.5 rounded-full text-[12px]"
        style={{
          background: "var(--pc-surface2)",
          border: "1px solid var(--pc-border)",
          color: "var(--pc-muted)",
        }}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search departments, cohorts, reports…</span>
        <span
          className="ml-auto text-[10.5px] px-1.5 py-0.5 rounded"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}
        >
          ⌘K
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-start pt-[14vh] px-4"
          style={{ background: "var(--pc-scrim)" }}
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Command palette"
            className="w-full max-w-xl rounded-2xl overflow-hidden"
            style={{
              background: "var(--pc-surface)",
              border: "1px solid var(--pc-border)",
              boxShadow: "0 24px 60px -20px color-mix(in oklab, var(--pc-ink) 40%, transparent)",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onListKey}
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--pc-border)" }}>
              <Search className="h-4 w-4" style={{ color: "var(--pc-muted)" }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to page — try 'departments', 'reports', 'audit'"
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: "var(--pc-ink)" }}
              />
              <span className="text-[10.5px] px-1.5 py-0.5 rounded" style={{ color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}>Esc</span>
            </div>
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1">
              {results.length === 0 && (
                <div className="px-4 py-8 text-center text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
                  No matches for “{q}”.
                </div>
              )}
              {(() => {
                let currentGroup = "";
                return results.map((r, i) => {
                  const showHeader = r.group !== currentGroup;
                  currentGroup = r.group;
                  const isActive = i === active;
                  const Icon = r.icon;
                  return (
                    <div key={r.url + i}>
                      {showHeader && (
                        <div
                          className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider"
                          style={{ color: "var(--pc-muted)", letterSpacing: "0.12em" }}
                        >
                          {r.group}
                        </div>
                      )}
                      <button
                        type="button"
                        data-idx={i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(r.url)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-[13px]"
                        style={{
                          background: isActive ? "var(--pc-surface2)" : "transparent",
                          color: "var(--pc-ink)",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 truncate">{r.title}</span>
                        <span className="text-[10.5px] font-mono truncate" style={{ color: "var(--pc-muted)" }}>{r.url}</span>
                        {isActive && <CornerDownLeft className="h-3.5 w-3.5" style={{ color: "var(--pc-muted)" }} />}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
            <div
              className="flex items-center justify-between px-4 py-2 text-[10.5px]"
              style={{ borderTop: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}
            >
              <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
              <span>↑ ↓ navigate · ↵ open · Esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function UserMenu() {
  const [open, setOpen] = useState(false);
  const college = useCollegeContext();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-medium text-white"
        style={{ background: college?.colorAccent ?? "var(--pc-primary)" }}
        aria-label="Account"
      >
        {college?.initials ?? <User className="h-4 w-4" />}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl p-2 z-40"
          style={{
            background: "var(--pc-surface)",
            border: "1px solid var(--pc-border)",
            boxShadow: "0 16px 40px -18px color-mix(in oklab, var(--pc-ink) 35%, transparent)",
          }}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-2 py-1.5">
            <div className="text-[12px] font-serif" style={{ color: "var(--pc-ink)" }}>{college?.shortName ?? "PeaceCode"}</div>
            <div className="text-[10.5px] truncate" style={{ color: "var(--pc-muted)" }}>{college?.email ?? "—"}</div>
          </div>
          <div className="h-px my-1" style={{ background: "var(--pc-border)" }} />
          <Link
            to="/auth"
            onClick={() => {
              import("@/lib/auth-store").then((m) => m.endSession());
            }}
            className="block px-2 py-1.5 rounded-md text-[12.5px]"
            style={{ color: "var(--pc-ink-2)" }}
          >
            Sign out
          </Link>
        </div>
      )}
    </div>
  );
}

export function CollegeAppShell({ children }: { children: ReactNode }) {
  const college = useCollegeContext();
  const [dark, toggleDark] = useDark();
  const [helpOpen, setHelpOpen] = useState(false);
  const shellPathname = useRouterState({ select: (s) => s.location.pathname });
  useGlobalShortcuts({ onHelp: () => setHelpOpen(true) });

  useEffect(() => {
    const s = loadSettings();
    applyAppearance(s);
    applyAccessibility(s);
    const onSame = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (next) { applyAppearance(next); applyAccessibility(next); }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "peacecode.settings.v1") return;
      const s2 = loadSettings();
      applyAppearance(s2); applyAccessibility(s2);
    };
    window.addEventListener("peacecode-settings", onSame);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("peacecode-settings", onSame);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div style={{ background: "transparent", color: "var(--pc-ink)" }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:text-[13px]"
        style={{ background: "var(--pc-primary)", color: "#fff" }}
      >
        Skip to main content
      </a>
      <GlassFX />
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-dvh flex w-full">
          <AppSidebar />
          <SidebarInset style={{ background: "transparent" }}>
            <header
              className="pc-glass-header sticky top-2 z-30 h-12 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 mx-2 sm:mx-3 mt-2 rounded-full pc-safe-top"
              style={{
                background: "var(--pc-header)",
                border: "1px solid var(--pc-border)",
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
              }}
            >
              <SidebarTrigger />
              <Link to="/dashboard" aria-label="PeaceCode home" className="shrink-0">
                <BrandLockup compact />
              </Link>
              <span aria-hidden className="hidden md:inline h-4 w-px" style={{ background: "var(--pc-border)" }} />
              <div
                className="font-serif text-[13.5px] truncate hidden md:block"
                style={{ color: "var(--pc-ink-2)" }}
              >
                {college?.shortName ?? "PeaceCode for Colleges"}
              </div>
              <div className="flex-1 flex justify-center min-w-0">
                <CommandK />
              </div>
              <div className="hidden sm:contents"><SeedModePill /></div>
              <span
                aria-label="k-anonymity threshold: 10"
                className="hidden md:inline-flex text-[11px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}
              >
                k=10
              </span>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Keyboard shortcuts"
                className="hidden sm:inline-grid p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 place-items-center"
                style={{ color: "var(--pc-ink-2)", background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <button
                onClick={toggleDark}
                aria-label="Toggle theme"
                className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 inline-grid place-items-center"
                style={{ color: "var(--pc-ink-2)", background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <NotificationsBell />
              <ProfileMenu />
              {false && <UserMenu />}
            </header>
            <main
              id="main-content"
              className="px-3 sm:px-5 md:px-8 py-4 lg:py-5 max-w-[1400px] w-full pb-[calc(env(safe-area-inset-bottom,0px)+76px)] md:pb-4"
            >
              <Breadcrumbs />
              <PageTransition pathname={shellPathname}>{children}</PageTransition>
            </main>
            <MobileTabBar />
          </SidebarInset>
        </div>
      </SidebarProvider>
      <KeyboardHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
