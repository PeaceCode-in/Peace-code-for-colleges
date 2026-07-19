import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, GraduationCap, Users, GitCompareArrows,
  Activity, ClipboardList, Waves, Grid3x3,
  AlertTriangle, Share2, Gauge,
  FileText, Download, LineChart,
  ShieldCheck, ScrollText, Palette, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useCollegeContext } from "@/lib/college-context";
import { endSession } from "@/lib/auth-store";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  { label: "Overview", items: [
    { title: "Executive overview", url: "/dashboard", icon: LayoutDashboard },
  ]},
  { label: "Cohort insights", items: [
    { title: "Departments", url: "/departments", icon: Building2 },
    { title: "Year & program", url: "/cohorts/year", icon: GraduationCap },
    { title: "Demographics", url: "/cohorts/demographics", icon: Users },
    { title: "Compare cohorts", url: "/cohorts/compare", icon: GitCompareArrows },
  ]},
  { label: "Wellbeing signals", items: [
    { title: "Overview", url: "/signals/wellbeing", icon: Activity },
    { title: "Mood trends", url: "/signals/mood", icon: Activity },
    { title: "Screening outcomes", url: "/signals/screenings", icon: ClipboardList },
    { title: "Engagement rhythm", url: "/signals/engagement", icon: Waves },
    { title: "Wellness heatmap", url: "/signals/heatmap", icon: Grid3x3 },
  ]},

  { label: "Early warning & care", items: [
    { title: "Early warning", url: "/care/risk", icon: AlertTriangle },
    { title: "Referral pipeline", url: "/care/referrals", icon: Share2 },
    { title: "Counsellor capacity", url: "/care/capacity", icon: Gauge },
  ]},
  { label: "Institutional reporting", items: [
    { title: "Term reports", url: "/reports/term", icon: FileText },
    { title: "Data exports", url: "/reports/exports", icon: Download },
    { title: "Peer benchmarks", url: "/reports/benchmarks", icon: LineChart },
  ]},
  { label: "Administration", items: [
    { title: "Access & roles", url: "/admin/access", icon: ShieldCheck },
    { title: "Audit log", url: "/admin/audit", icon: ScrollText },
    { title: "Appearance", url: "/settings/appearance", icon: Palette },
  ]},
];

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
    <Sidebar collapsible="icon" style={{ background: "var(--pc-surface)", borderColor: "var(--pc-border)" }}>
      <SidebarContent style={{ background: "var(--pc-surface)" }}>
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
                              background: active
                                ? "color-mix(in oklab, var(--pc-primary) 10%, transparent)"
                                : "transparent",
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

      <SidebarFooter style={{ background: "var(--pc-surface)", borderTop: "1px solid var(--pc-border)" }}>
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
