import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Moon, Sun, User, Keyboard } from "lucide-react";
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

function CommandK() {
  const [open, setOpen] = useState(false);
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
          className="fixed inset-0 z-50 grid place-items-start pt-[18vh] px-4"
          style={{ background: "var(--pc-scrim)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl p-6"
            style={{
              background: "var(--pc-surface)",
              border: "1px solid var(--pc-border)",
              boxShadow: "0 24px 60px -20px color-mix(in oklab, var(--pc-ink) 40%, transparent)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: "1px solid var(--pc-border)" }}>
              <Search className="h-4 w-4" style={{ color: "var(--pc-muted)" }} />
              <input
                autoFocus
                placeholder="Search — command palette arrives with Prompt 2"
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: "var(--pc-ink)" }}
              />
              <span className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>Esc</span>
            </div>
            <p className="mt-4 text-[12px]" style={{ color: "var(--pc-muted)" }}>
              A searchable jump-to for every route and cohort will live here.
            </p>
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
      <SidebarProvider>
        <div className="min-h-dvh flex w-full">
          <AppSidebar />
          <SidebarInset style={{ background: "transparent" }}>
            <header
              className="pc-glass-header sticky top-2 z-30 h-12 flex items-center gap-3 px-4 mx-3 mt-2 rounded-full"
              style={{
                background: "var(--pc-header)",
                border: "1px solid var(--pc-border)",
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
              }}
            >
              <SidebarTrigger />
              <div
                className="font-serif text-[15px] truncate"
                style={{ color: "var(--pc-ink)" }}
              >
                {college?.shortName ?? "PeaceCode for Colleges"}
              </div>
              <div className="flex-1 flex justify-center">
                <CommandK />
              </div>
              <SeedModePill />
              <span
                aria-label="k-anonymity threshold: 10"
                className="hidden sm:inline-flex text-[11px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}
              >
                k=10
              </span>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Keyboard shortcuts"
                className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2"
                style={{ color: "var(--pc-ink-2)", background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <button
                onClick={toggleDark}
                aria-label="Toggle theme"
                className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2"
                style={{ color: "var(--pc-ink-2)", background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <NotificationsBell />
              <ProfileMenu />
              {/* Legacy UserMenu removed — ProfileMenu supersedes it. */}
              {false && <UserMenu />}
            </header>
            <main id="main-content" className="px-5 sm:px-8 py-4 lg:py-5 max-w-[1400px] w-full">
              <Breadcrumbs />
              <PageTransition pathname={shellPathname}>{children}</PageTransition>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <KeyboardHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
