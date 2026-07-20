import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, GraduationCap, Users, GitCompareArrows, BookOpen,
  Activity, ClipboardList, Waves, Grid3x3, CalendarClock,
  AlertTriangle, Share2, Gauge, Route as RouteIcon,
  FileText, History,
  ShieldCheck, UserCog, Landmark, ScrollText,
  Palette, User as UserIcon, BellRing,
  HelpCircle, TerminalSquare, Braces,
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
    { title: "Executive overview", url: "/dashboard", icon: LayoutDashboard },
  ]},
  { label: "Cohort insights", items: [
    { title: "Departments",     url: "/departments",          icon: Building2 },
    { title: "Year & program",  url: "/cohorts/year",         icon: GraduationCap },
    { title: "Programs",        url: "/cohorts/programs",     icon: BookOpen },
    { title: "Demographics",    url: "/cohorts/demographics", icon: Users },
    { title: "Compare cohorts", url: "/cohorts/compare",      icon: GitCompareArrows },
  ]},
  { label: "Wellbeing signals", items: [
    { title: "Overview",           url: "/signals/wellbeing",   icon: Activity },
    { title: "Mood trends",        url: "/signals/mood",        icon: Activity },
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
    { title: "Account",       url: "/settings/account",       icon: UserIcon },
    { title: "Notifications", url: "/settings/notifications", icon: BellRing },
  ]},
  { label: "Support", items: [
    { title: "Help & policy",    url: "/help",     icon: HelpCircle },
    { title: "QA self-check",    url: "/qa",       icon: TerminalSquare },
    { title: "QA data dump",     url: "/qa-data",  icon: Braces },
  ]},
];

const GROUPS = SIDEBAR_GROUPS;


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const college = useCollegeContext();
  const nav = useNavigate();

  const isActive = (u: string) => pathname === u || pathname.startsWith(u + "/");

  const signOut = () => {
    endSession();
    nav({ to: "/auth" });
  };

  return (
    <Sidebar collapsible="icon" variant="floating" className="pc-glass-tube" style={{ background: "transparent", borderColor: "transparent" }}>
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
        {GROUPS.map((g) => {
          return (
            <SidebarGroup key={g.label}>
              {!collapsed && (
                <SidebarGroupLabel
                  className="text-[10px] uppercase"
                  style={{ letterSpacing: "0.16em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
                >
                  {g.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {g.items.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                        >
                          <Link
                            to={item.url}
                            className="flex items-center gap-2"
                            style={{
                              color: active ? "var(--pc-primary)" : "var(--pc-ink-2)",
                            }}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span className="text-[13px]">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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
