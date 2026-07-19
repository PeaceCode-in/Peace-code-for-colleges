import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen, Settings, Bell, Flame, Users, Wind, Search,
  Heart, PenLine, Bot, CalendarCheck, UserCheck, ClipboardList, Target, Activity, Brain,
  Menu, X, Home, LifeBuoy, CalendarDays,
  User, LogOut, Palette, ShieldCheck, HelpCircle, ChevronRight,
} from "lucide-react";

import logo from "@/assets/peacecode-logo.png";
import { loadSettings, applyAppearance, applyAccessibility } from "@/lib/settings-store";
import { unreadCount as notifUnread } from "@/lib/notifications-store";
import { currentDisplayName } from "@/lib/auth-store";
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

// ─── theme (persistent, cross-page) ─────────────────────────────────
const THEME_KEY = "peacecode.theme.v1";
export type Theme = "light" | "dark";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.setAttribute("data-theme", t);
  try { localStorage.setItem(THEME_KEY, t); } catch {}
  window.dispatchEvent(new CustomEvent("peacecode-theme", { detail: t }));
}
export function useTheme(): [Theme, (t: Theme) => void, () => void] {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    const t = getInitialTheme();
    setThemeState(t);
    applyTheme(t);
    const onSync = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (next && next !== theme) setThemeState(next);
    };
    window.addEventListener("peacecode-theme", onSync);
    return () => window.removeEventListener("peacecode-theme", onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setTheme = (t: Theme) => { setThemeState(t); applyTheme(t); };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return [theme, setTheme, toggle];
}



const { bg, surface, surface2, border, ink, muted, primary, soft } = palette;

type NavItem = { icon: typeof Home; label: string; to?: string };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { icon: Home, label: "Today", to: "/" },
    ],
  },
  {
    label: "Core Care",
    items: [
      { icon: Bot, label: "Peace Bot", to: "/peacebot" },
      { icon: CalendarCheck, label: "Counselling", to: "/counselling" },
      { icon: UserCheck, label: "Peace Buddies", to: "/buddies" },
      { icon: ClipboardList, label: "Screening", to: "/screening" },
    ],
  },
  {
    label: "Wellness Tools",
    items: [
      { icon: Wind, label: "Breathe", to: "/breathe" },
      { icon: Target, label: "Focus", to: "/focus" },
      { icon: Heart, label: "Gratitude", to: "/gratitude" },
      { icon: PenLine, label: "Journal", to: "/journal" },
      { icon: Activity, label: "Mood Tracker" },
      { icon: Brain, label: "Mind Gym", to: "/mindgym" },
    ],
  },
  {
    label: "Community & Resources",
    items: [
      { icon: Users, label: "Community", to: "/community" },
      { icon: CalendarDays, label: "Events", to: "/events" },
      { icon: BookOpen, label: "Resources", to: "/resources" },
      { icon: LifeBuoy, label: "Emergency", to: "/emergency" },
    ],
  },
];


function Mark({ className = "w-5 h-5", opacity = 1 }: { className?: string; opacity?: number }) {
  return <img src={logo} alt="" className={className} style={{ opacity }} />;
}

export function AppShell({ children, showHeader = true }: { children: ReactNode; showHeader?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useTheme();
  const [unread, setUnread] = useState(0);

  // Sidebar: hover-to-expand only (no persistence, no pinning).


  useEffect(() => {
    const refresh = () => { try { setUnread(notifUnread()); } catch {} };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    // Apply persisted appearance/accessibility once per mount.
    try { const s = loadSettings(); applyAppearance(s); applyAccessibility(s); } catch {}
    // Adaptive perf tier for grain/animation cost.
    // Uses deviceMemory, hardwareConcurrency, and the Save-Data hint.
    try {
      const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
      const mem = nav.deviceMemory ?? 8;
      const cores = nav.hardwareConcurrency ?? 8;
      const saveData = nav.connection?.saveData === true;
      const slowNet = /(^2g$|^slow-2g$|^3g$)/.test(nav.connection?.effectiveType ?? "");
      const tier = (saveData || slowNet || mem <= 2 || cores <= 2)
        ? "low"
        : (mem <= 4 || cores <= 4) ? "med" : "high";
      document.documentElement.setAttribute("data-pc-perf", tier);
    } catch {}

    // Global ⌘K / Ctrl+K → Search Center
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (typeof window !== "undefined" && window.location.pathname !== "/search") {
          window.location.href = "/search";
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // ── swipe-to-open / swipe-to-close for the mobile drawer ──
  // Edge-swipe from the right opens; drag right on drawer closes.
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const scrimRef  = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ active: boolean; mode: "open" | "close" | null; x0: number; y0: number; dx: number; w: number; locked: boolean; decided: boolean }>({
    active: false, mode: null, x0: 0, y0: 0, dx: 0, w: 0, locked: false, decided: false,
  });
  const [dragging, setDragging] = useState(false); // triggers drawer mount while opening

  useEffect(() => {
    if (typeof window === "undefined") return;

    const EDGE = 24;         // px from right edge that counts as edge-swipe
    const AXIS_LOCK = 10;    // px before we lock horizontal vs vertical
    const THRESHOLD = 0.28;  // fraction of drawer width to trigger open/close

    const setTransform = (px: number, progress: number) => {
      const d = drawerRef.current, s = scrimRef.current;
      if (d) d.style.transform = `translate3d(${px}px,0,0)`;
      if (s) s.style.opacity = String(Math.max(0, Math.min(1, progress)));
    };
    const clearTransform = () => {
      const d = drawerRef.current, s = scrimRef.current;
      if (d) { d.style.transform = ""; d.style.transition = ""; }
      if (s) { s.style.opacity = ""; s.style.transition = ""; }
    };
    const animateTo = (px: number, progress: number, done: () => void) => {
      const d = drawerRef.current, s = scrimRef.current;
      if (d) { d.style.transition = "transform 220ms cubic-bezier(0.22,1,0.36,1)"; d.style.transform = `translate3d(${px}px,0,0)`; }
      if (s) { s.style.transition = "opacity 220ms ease"; s.style.opacity = String(progress); }
      window.setTimeout(() => { clearTransform(); done(); }, 230);
    };

    const onStart = (e: TouchEvent) => {
      if (window.innerWidth >= 1024) return; // desktop
      if (drag.current.active) return;
      const t = e.touches[0]; if (!t) return;
      const openNow = mobileOpen;
      const nearRightEdge = t.clientX >= window.innerWidth - EDGE;
      if (!openNow && !nearRightEdge) return;
      // Ignore if touch starts inside a horizontally scrollable element (carousels)
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("[data-no-swipe]")) return;

      drag.current = {
        active: true,
        mode: openNow ? "close" : "open",
        x0: t.clientX, y0: t.clientY, dx: 0,
        w: Math.min(window.innerWidth * 0.86, 384),
        locked: false, decided: false,
      };
      if (!openNow) setDragging(true);
    };

    const onMove = (e: TouchEvent) => {
      const g = drag.current; if (!g.active) return;
      const t = e.touches[0]; if (!t) return;
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (!g.decided) {
        if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
        // horizontal lock only if x dominates and direction matches mode
        const horiz = Math.abs(dx) > Math.abs(dy) * 1.2;
        const rightward = dx > 0;
        const wantRight = g.mode === "close";
        const wantLeft  = g.mode === "open";
        if (!horiz || (wantRight && !rightward) || (wantLeft && rightward)) {
          g.active = false; setDragging(false); return;
        }
        g.locked = true; g.decided = true;
      }
      if (!g.locked) return;
      if (e.cancelable) e.preventDefault();
      let px: number, progress: number;
      if (g.mode === "open") {
        // drawer starts fully off-screen (translateX = w) → drag left toward 0
        px = Math.max(0, g.w + dx); // dx is negative
        progress = 1 - px / g.w;
      } else {
        px = Math.max(0, dx);       // dx is positive
        progress = 1 - px / g.w;
      }
      g.dx = dx;
      setTransform(px, progress);
    };

    const onEnd = () => {
      const g = drag.current; if (!g.active) return;
      const wasLocked = g.locked;
      const mode = g.mode;
      const w = g.w;
      const travel = Math.abs(g.dx);
      drag.current.active = false;
      drag.current.locked = false;
      drag.current.decided = false;

      if (!wasLocked) { setDragging(false); return; }

      const passed = travel / w >= THRESHOLD;
      if (mode === "open") {
        if (passed) { animateTo(0, 1, () => { setMobileOpen(true); setDragging(false); }); }
        else        { animateTo(w, 0, () => { setDragging(false); }); }
      } else {
        if (passed) { animateTo(w, 0, () => { setMobileOpen(false); }); }
        else        { animateTo(0, 1, () => {}); }
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove",  onMove,  { passive: false });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    window.addEventListener("touchcancel",onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove",  onMove as EventListener);
      window.removeEventListener("touchend",   onEnd);
      window.removeEventListener("touchcancel",onEnd);
    };
  }, [mobileOpen]);


  const isActive = (to?: string) => {
    if (!to) return false;
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(to + "/");
  };


  return (
    <div className="min-h-screen w-full font-sans" style={{ background: "transparent", color: ink }}>
      {/* Global frosted-glass backdrop — sky-clouds + blur + tone + grain. */}
      <GlassFX />
      {/* constant, calm aurora — same on every page, themeable */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 lg:-top-40 lg:-left-40 lg:w-[520px] lg:h-[520px] rounded-full opacity-45 blur-3xl"
             style={{ background: "radial-gradient(circle,var(--pc-aurora-a),transparent 70%)" }} />
        <div className="absolute top-1/3 -right-24 w-80 h-80 lg:-right-40 lg:w-[600px] lg:h-[600px] rounded-full opacity-30 blur-3xl"
             style={{ background: "radial-gradient(circle,var(--pc-aurora-b),transparent 70%)" }} />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 lg:-bottom-40 lg:left-1/3 lg:w-[500px] lg:h-[500px] rounded-full opacity-25 blur-3xl"
             style={{ background: "radial-gradient(circle,var(--pc-aurora-c),transparent 70%)" }} />
      </div>

      {/* ─── desktop sidebar ─── */}
      <aside
        className="pc-glass-sidebar hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 group flex-col py-6 rounded-[38px] transition-[width] duration-300 ease-out overflow-hidden w-[80px] hover:w-60"
        style={{ maxHeight: "min(92vh, 860px)" }}
      >





        <div className="flex items-center h-12 mb-8">
          <div className="w-[80px] shrink-0 flex justify-center"><Mark className="w-9 h-9" /></div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 whitespace-nowrap -ml-1">
            <div className="font-serif text-[17px] leading-none">PeaceCode</div>
            <div className="text-[8px] tracking-[0.3em] uppercase opacity-50 mt-1.5">a soft place</div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 flex flex-col gap-4 px-3 overflow-x-hidden overflow-y-hidden group-hover:overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <div className="h-4 flex items-center pl-4 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                <span className="text-[8.5px] tracking-[0.32em] uppercase whitespace-nowrap" style={{ color: "var(--pc-ink)", opacity: 0.7 }}>{group.label}</span>
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                const cls = "pc-nav-item relative flex items-center h-11 rounded-2xl";
                const style = active ? { background: surface2, color: "var(--pc-ink)", fontWeight: 600 } : { color: "var(--pc-ink)" };
                const inner = (
                  <>
                    <span className="w-[56px] shrink-0 flex justify-center">
                      <Icon className="pc-nav-icon w-[19px] h-[19px]" strokeWidth={1.4} />
                    </span>
                    <span className="pc-nav-label text-[13px] tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 -ml-1">{item.label}</span>
                  </>
                );
                return item.to ? (
                  <Link key={item.label} to={item.to} className={cls} style={style} aria-label={item.label}>{inner}</Link>
                ) : (
                  <button key={item.label} className={cls} style={style} aria-label={item.label}>{inner}</button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 mt-4 mx-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex items-center h-11 rounded-2xl" style={{ color: "var(--pc-ink)" }} aria-label="Current streak">
            <span className="w-[56px] shrink-0 flex justify-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: soft, color: primary }}>
                <Flame className="w-4 h-4" strokeWidth={1.6}/>
              </span>
            </span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 whitespace-nowrap -ml-1">
              <div className="text-[12.5px] leading-none">12 day streak</div>
              <div className="text-[9px] tracking-[0.25em] uppercase opacity-50 mt-1">keep going</div>
            </div>
          </div>
        </div>


      </aside>

      {/* ─── mobile top bar ─── */}
      {showHeader && (
        <header className="lg:hidden sticky top-0 z-30 backdrop-blur-xl" style={{ background: "transparent" }}>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5 py-3">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <Mark className="w-8 h-8 shrink-0"/>
              <div className="min-w-0">
                <div className="font-serif text-[15px] leading-none truncate">PeaceCode</div>
                <div className="text-[7.5px] tracking-[0.3em] uppercase mt-1 opacity-50 truncate">a soft place</div>
              </div>
            </Link>
            <div />
            <div className="flex items-center gap-1.5 shrink-0">
              <TopBarActions unread={unread} compact />
              <button onClick={() => setMobileOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-[1.04] active:scale-95" style={{ background: "rgba(255,255,255,0.55)", border: `1px solid rgba(255,255,255,0.55)`, backdropFilter: "blur(14px)" }} aria-label="open navigation">
                <Menu className="w-4 h-4 opacity-70"/>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ─── desktop floating top-right actions ─── */}
      <div className="hidden lg:flex fixed top-6 right-8 z-40 items-center gap-2">
        <TopBarActions unread={unread} />
      </div>


      {/* mobile drawer (mounted while open OR during edge-swipe open) */}
      {(mobileOpen || dragging) && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            ref={scrimRef}
            className="pc-mobile-scrim absolute inset-0"
            onClick={() => setMobileOpen(false)}
            style={dragging && !mobileOpen ? { opacity: 0 } : undefined}
          />

          <div
            ref={drawerRef}
            className="pc-mobile-drawer absolute top-0 right-0 bottom-0 w-[86%] max-w-sm p-5 flex flex-col overflow-y-auto overscroll-contain will-change-transform"
            style={dragging && !mobileOpen ? { transform: "translate3d(100%,0,0)" } : undefined}
          >

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><Mark className="w-7 h-7"/>
                <div>
                  <div className="font-serif text-[15px] leading-none">PeaceCode</div>
                  <div className="text-[8px] tracking-[0.3em] uppercase opacity-50 mt-1">a soft place</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: "rgba(255,255,255,0.55)", border: `1px solid rgba(255,255,255,0.6)` }} aria-label="close navigation">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <nav className="flex flex-col gap-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="text-[9px] tracking-[0.3em] uppercase mb-2 px-1" style={{ color: "var(--pc-ink)", opacity: 0.65 }}>{group.label}</div>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.to);
                      const cls = "pc-nav-item flex items-center gap-3 h-12 px-3 rounded-2xl text-[14px]";
                      const style = active ? { background: "rgba(255,255,255,0.6)", color: "var(--pc-ink)", fontWeight: 600 } : { color: "var(--pc-ink)" };
                      return item.to ? (
                        <Link key={item.label} to={item.to} className={cls} style={style}>
                          <Icon className="pc-nav-icon w-4 h-4" strokeWidth={1.5}/> <span className="pc-nav-label opacity-100">{item.label}</span>
                        </Link>
                      ) : (
                        <button key={item.label} className={cls} style={style}>
                          <Icon className="pc-nav-icon w-4 h-4" strokeWidth={1.5}/> <span className="pc-nav-label opacity-100">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <Link to="/settings" className="pc-nav-item mt-6 flex items-center gap-3 h-12 px-3 rounded-2xl text-[14px]" style={{ background: "rgba(255,255,255,0.55)", color: ink }}>
              <Settings className="pc-nav-icon w-4 h-4" strokeWidth={1.5}/> Settings
            </Link>
          </div>
        </div>
      )}

      {/* content */}
      <main className="relative z-10 lg:pl-[108px] lg:pr-6 lg:pt-4 pb-24 lg:pb-6 mx-auto w-full max-w-[1440px]">
        {children}
      </main>




      {/* ─── floating Emergency button (global, calm not scary) ─── */}
      {!pathname.startsWith("/emergency") && (
        <Link
          to="/emergency"
          aria-label="Open Emergency Center"
          className="fixed z-40 flex items-center gap-2 rounded-full pl-3 pr-4 h-11 backdrop-blur-xl transition hover:scale-[1.02] active:scale-[0.98]"
          style={{
            right: "18px",
            bottom: "22px",
            background: "var(--pc-surface)",
            border: `1px solid ${border}`,
            boxShadow: "0 18px 40px -20px rgba(0,0,0,0.25)",
            color: ink,
          }}
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: soft }}>
            <LifeBuoy className="w-3.5 h-3.5" strokeWidth={1.6} />
          </span>
          <span className="text-[12px] tracking-wide">Emergency</span>
        </Link>
      )}
    </div>
  );
}

// ─── Top-right actions bar: Search • Notifications • Profile dropdown ───
// Transparent, floating, aesthetic. Present on every AppShell page.
function TopBarActions({ unread, compact = false }: { unread: number; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const btnSize = compact ? "w-9 h-9" : "w-10 h-10";
  const iconCls = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  const who = currentDisplayName();
  const initial = (who.first?.[0] ?? "G").toUpperCase();
  const chrome: React.CSSProperties = {
    background: "rgba(255,255,255,0.42)",
    border: "1px solid rgba(255,255,255,0.55)",
    backdropFilter: "blur(18px) saturate(140%)",
    boxShadow: "0 8px 24px -14px rgba(20,30,60,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
    color: "var(--pc-ink)",
  };

  return (
    <>
      <Link to="/search" aria-label="Search" className={`${btnSize} rounded-full flex items-center justify-center transition hover:scale-[1.04] active:scale-95`} style={chrome}>
        <Search className={iconCls} strokeWidth={1.6}/>
      </Link>
      <Link to="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className={`relative ${btnSize} rounded-full flex items-center justify-center transition hover:scale-[1.04] active:scale-95`} style={chrome}>
        <Bell className={iconCls} strokeWidth={1.6}/>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-medium flex items-center justify-center" style={{ background: "var(--pc-primary)", color: "white" }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Open profile menu"
          aria-expanded={open}
          className={`${btnSize} rounded-full flex items-center justify-center transition hover:scale-[1.04] active:scale-95`}
          style={{ ...chrome, padding: 2 }}
        >
          <span className="w-full h-full rounded-full flex items-center justify-center font-serif text-[13px]" style={{ background: "linear-gradient(135deg, var(--pc-soft), rgba(255,255,255,0.65))", color: "var(--pc-ink)" }}>
            {initial}
          </span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-[280px] rounded-2xl overflow-hidden origin-top-right animate-[pcMenu_180ms_cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(255,255,255,0.7)",
              backdropFilter: "blur(24px) saturate(160%)",
              boxShadow: "0 24px 60px -24px rgba(20,30,60,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
              color: "var(--pc-ink)",
            }}
          >
            {/* Profile header */}
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/40">
              <span className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-[16px]" style={{ background: "linear-gradient(135deg, var(--pc-soft), #ffffff)" }}>{initial}</span>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[15px] leading-tight truncate">{who.first}</div>
                <div className="flex items-center gap-1 mt-0.5 text-[10.5px]" style={{ color: "var(--pc-primary)" }}>
                  <Flame className="w-3 h-3" strokeWidth={1.6}/> 12 day streak
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40"/>
            </Link>

            <div className="h-px mx-3" style={{ background: "rgba(20,30,60,0.08)" }} />

            <MenuItem to="/profile" icon={User} label="Your profile" onClick={() => setOpen(false)} />
            <MenuItem to="/settings" icon={Settings} label="Settings" onClick={() => setOpen(false)} />
            <MenuItem to="/settings/appearance" icon={Palette} label="Appearance" onClick={() => setOpen(false)} />
            <MenuItem to="/settings/privacy" icon={ShieldCheck} label="Privacy & data" onClick={() => setOpen(false)} />
            <MenuItem to="/notifications" icon={Bell} label="Notifications" badge={unread} onClick={() => setOpen(false)} />

            <div className="h-px mx-3" style={{ background: "rgba(20,30,60,0.08)" }} />

            <MenuItem to="/settings/support" icon={HelpCircle} label="Help & support" onClick={() => setOpen(false)} />
            <MenuItem to="/settings/logout" icon={LogOut} label="Sign out" onClick={() => setOpen(false)} danger />

            <div className="px-4 pb-3 pt-1 text-[10px] tracking-[0.22em] uppercase" style={{ color: "rgba(15,37,64,0.45)" }}>
              PeaceCode · a soft place
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MenuItem({
  to, icon: Icon, label, badge, danger, onClick,
}: { to: string; icon: typeof Home; label: string; badge?: number; danger?: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition hover:bg-white/50"
      style={{ color: danger ? "#b23a48" : "var(--pc-ink)" }}
    >
      <Icon className="w-3.5 h-3.5 opacity-70" strokeWidth={1.6}/>
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] flex items-center justify-center" style={{ background: "var(--pc-primary)", color: "white" }}>
          {badge > 99 ? "99+" : badge}
        </span>
      ) : (
        <ChevronRight className="w-3 h-3 opacity-30"/>
      )}
    </Link>
  );
}


