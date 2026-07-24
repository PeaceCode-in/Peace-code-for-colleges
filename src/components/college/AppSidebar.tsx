import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  Sparkles, Building2, GraduationCap, Users, GitCompareArrows, BookOpen,
  HeartPulse, LineChart, ClipboardList, Waves, CalendarClock, Grid3x3,
  AlertTriangle, Route as RouteIcon, Share2, Gauge,
  FileText, History,
  ShieldCheck, UserCog, Landmark, ScrollText,
  Palette, UserCircle2, BellRing,
  LifeBuoy, TerminalSquare, Braces,
  LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useCollegeContext } from "@/lib/college-context";
import { endSession } from "@/lib/auth-store";
import { BrandMark, BrandLockup } from "@/components/college/BrandMark";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
type Group = { label: string; items: Item[] };

export const SIDEBAR_GROUPS: Group[] = [
  { label: "Overview", items: [
    { title: "Executive overview", url: "/dashboard", icon: Sparkles },
  ]},
  { label: "Cohort insights", items: [
    { title: "Departments",     url: "/departments",          icon: Building2 },
    { title: "Year & program",  url: "/cohorts/year",         icon: GraduationCap },
    { title: "Programs",        url: "/cohorts/programs",     icon: BookOpen },
    { title: "Demographics",    url: "/cohorts/demographics", icon: Users },
    { title: "Compare cohorts", url: "/cohorts/compare",      icon: GitCompareArrows },
  ]},
  { label: "Wellbeing signals", items: [
    { title: "Overview",           url: "/signals/wellbeing",   icon: HeartPulse },
    { title: "Mood trends",        url: "/signals/mood",        icon: LineChart },
    { title: "Screening outcomes", url: "/signals/screenings",  icon: ClipboardList },
    { title: "Engagement rhythm",  url: "/signals/engagement",  icon: Waves },
    { title: "Sessions",           url: "/signals/sessions",    icon: CalendarClock },
    { title: "Wellness heatmap",   url: "/signals/heatmap",     icon: Grid3x3 },
  ]},
  { label: "Early warning & care", items: [
    { title: "Early warning",       url: "/care/risk",       icon: AlertTriangle },
    { title: "Care routing",        url: "/care/routing",    icon: RouteIcon },
    { title: "Referral pipeline",   url: "/care/referrals",  icon: Share2 },
    { title: "Counsellor capacity", url: "/care/capacity",   icon: Gauge },
  ]},
  { label: "Institutional reporting", items: [
    { title: "Reports",        url: "/reports",         icon: FileText },
    { title: "Report history", url: "/reports/history", icon: History },
  ]},
  { label: "Administration", items: [
    { title: "Overview",    url: "/admin",             icon: ShieldCheck },
    { title: "Members",     url: "/admin/members",     icon: UserCog },
    { title: "Institution", url: "/admin/institution", icon: Landmark },
    { title: "Audit log",   url: "/admin/audit",       icon: ScrollText },
  ]},
  { label: "Settings", items: [
    { title: "Appearance",    url: "/settings/appearance",    icon: Palette },
    { title: "Account",       url: "/settings/account",       icon: UserCircle2 },
    { title: "Notifications", url: "/settings/notifications", icon: BellRing },
  ]},
  { label: "Support", items: [
    { title: "Help & policy",    url: "/help",     icon: LifeBuoy },
    { title: "QA self-check",    url: "/qa",       icon: TerminalSquare },
    { title: "QA data dump",     url: "/qa-data",  icon: Braces },
  ]},
];

const GROUPS = SIDEBAR_GROUPS;


export function AppSidebar() {
  const { state, setOpen, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const college = useCollegeContext();
  const nav = useNavigate();
  const hoverTimer = useRef<number | null>(null);

  const isActive = (u: string) => pathname === u || pathname.startsWith(u + "/");

  const signOut = () => {
    endSession();
    nav({ to: "/auth" });
  };

  const handleEnter = () => {
    if (isMobile) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpen(true), 90);
  };
  const handleLeave = () => {
    if (isMobile) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpen(false), 220);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="pc-glass-tube"
      style={{ background: "transparent", borderColor: "transparent" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <SidebarHeader style={{ background: "transparent" }}>
        <Link
          to="/dashboard"
          aria-label="PeaceCode home"
          className="flex items-center justify-center px-2 pt-2 pb-1"
        >
          {collapsed ? (
            <span
              className="inline-grid place-items-center rounded-full"
              style={{
                width: 32, height: 32,
                background: "color-mix(in oklab, var(--pc-primary) 14%, transparent)",
                color: "var(--pc-primary)",
                border: "1px solid color-mix(in oklab, var(--pc-primary) 25%, transparent)",
              }}
            >
              <BrandMark size={18} />
            </span>
          ) : (
            <BrandLockup />
          )}
        </Link>
        <div aria-hidden className="mx-3 my-1 h-px" style={{ background: "var(--pc-border)" }} />
      </SidebarHeader>
      <SidebarContent style={{ background: "transparent" }}>
        <NavGlider deps={[pathname]}>
        {GROUPS.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel
              className="text-[10px] uppercase"
              style={{ letterSpacing: "0.16em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
            >
              {g.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <NavRow key={item.url} item={item} active={isActive(item.url)} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        </NavGlider>
      </SidebarContent>


      <SidebarFooter style={{ background: "transparent" }}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-medium text-white"
              style={{ background: college?.colorAccent ?? "var(--pc-primary)" }}
            >
              {college?.initials ?? "PC"}
            </div>
            <button onClick={signOut} title="Sign out" className="p-1.5 rounded-md" style={{ color: "var(--pc-muted)" }}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-medium text-white shrink-0"
                style={{ background: college?.colorAccent ?? "var(--pc-primary)" }}
              >
                {college?.initials ?? "PC"}
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] truncate font-serif" style={{ color: "var(--pc-ink)" }}>
                  {college?.shortName ?? "PeaceCode"}
                </div>
                <div className="text-[10.5px] truncate" style={{ color: "var(--pc-muted)" }}>
                  {college?.role ?? "Institution admin"}
                </div>
              </div>
            </div>
            <a
              href="https://peacecode.in"
              target="_blank"
              rel="noopener"
              className="w-full flex items-center justify-center gap-1.5 text-[10.5px] py-1 rounded-full"
              style={{ color: "var(--pc-muted)" }}
              title="Visit peacecode.in"
            >
              ← peacecode.in
            </a>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 text-[11.5px] py-1.5 rounded-full"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
                color: "var(--pc-ink-2)",
              }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function NavGlider({ children, deps }: { children: React.ReactNode; deps: unknown[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; height: number; visible: boolean }>({
    top: 0,
    height: 0,
    visible: false,
  });

  const measure = () => {
    const container = ref.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(
      '[data-sidebar="menu-button"][data-active="true"]',
    );
    if (!active) {
      setRect((r) => ({ ...r, visible: false }));
      return;
    }
    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    setRect({
      top: aRect.top - cRect.top + container.scrollTop,
      height: aRect.height,
      visible: true,
    });
  };

  useLayoutEffect(() => {
    measure();
    // Re-measure after transitions settle (sidebar collapse ~320ms).
    const t = window.setTimeout(measure, 340);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    if (ref.current) ro.observe(ref.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <span
        aria-hidden
        className="pc-nav-glider"
        data-visible={rect.visible ? "true" : "false"}
        style={{ transform: `translateY(${rect.top}px)`, height: rect.height }}
      />
      {children}
    </div>
  );
}
