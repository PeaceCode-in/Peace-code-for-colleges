import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import {
  Home as HomeIcon, Search, UserRound, CalendarClock, History, LineChart, Sparkles,
  BookOpen, Dumbbell, MessageCircle, FileText, ClipboardList, Pill, LifeBuoy, Receipt, Settings2, Phone,
} from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/counselling")({
  head: () => ({
    meta: [
      { title: "Counselling — PeaceCode" },
      { name: "description", content: "A complete, guided care journey with licensed psychologists — for Indian college students." },
      { property: "og:title", content: "Counselling — PeaceCode" },
      { property: "og:description", content: "Find a psychologist, book sessions, track progress, and stay supported." },
    ],
  }),
  component: CounsellingLayout,
});

const secondary: { label: string; to: string; icon: typeof HomeIcon; exact?: boolean }[] = [
  { label: "Home",            to: "/counselling",              icon: HomeIcon, exact: true },
  { label: "Find Experts",    to: "/counselling/experts",      icon: Search },
  { label: "My Counsellors",  to: "/counselling/my",           icon: UserRound },
  { label: "Upcoming",        to: "/counselling/upcoming",     icon: CalendarClock },
  { label: "History",         to: "/counselling/history",      icon: History },
  { label: "Reports",         to: "/counselling/reports",      icon: LineChart },
  { label: "Wellness Plan",   to: "/counselling/wellness",     icon: Sparkles },
  { label: "Homework",        to: "/counselling/homework",     icon: Dumbbell },
  { label: "Resources",       to: "/counselling/resources",    icon: BookOpen },
  { label: "Messages",        to: "/counselling/messages",     icon: MessageCircle },
  { label: "Documents",       to: "/counselling/documents",    icon: FileText },
  { label: "Assessments",     to: "/counselling/assessments",  icon: ClipboardList },
  { label: "Medication",      to: "/counselling/medication",   icon: Pill },
  { label: "Billing",         to: "/counselling/billing",      icon: Receipt },
  { label: "Emergency",       to: "/counselling/emergency",    icon: LifeBuoy },
  { label: "Settings",        to: "/counselling/settings",     icon: Settings2 },
];

function CounsellingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { surface, surface2, border, ink, muted, primary } = palette;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-8">
          {/* secondary nav */}
          <aside className="hidden lg:block sticky top-6 self-start">
            <div className="rounded-3xl p-3" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="px-3 py-2 mb-1">
                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: muted }}>Counselling</div>
                <div className="font-serif text-lg" style={{ color: ink }}>Your care</div>
              </div>
              <nav className="flex flex-col gap-0.5">
                {secondary.map((s) => {
                  const active = s.exact ? pathname === s.to : pathname === s.to || pathname.startsWith(s.to + "/");
                  return (
                    <Link key={s.to} to={s.to}
                      className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-[13.5px] transition-colors"
                      style={{
                        background: active ? surface2 : "transparent",
                        color: active ? ink : muted,
                        border: active ? `1px solid ${border}` : "1px solid transparent",
                      }}>
                      <s.icon className="w-4 h-4" style={{ color: active ? primary : muted }} />
                      {s.label}
                    </Link>
                  );
                })}
              </nav>
              <Link to="/counselling/emergency" className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[13px]" style={{ background: "#fff1f0", color: "#9a1c1c", border: "1px solid #f6c9c4" }}>
                <Phone className="w-4 h-4" /> Emergency support
              </Link>
            </div>
          </aside>

          <main className="min-w-0">
            {/* mobile secondary nav */}
            <div className="lg:hidden -mx-3 px-3 mb-4 overflow-x-auto scrollbar-none">
              <div className="flex w-max max-w-none gap-2 pb-1">
                {secondary.map((s) => {
                  const active = s.exact ? pathname === s.to : pathname === s.to || pathname.startsWith(s.to + "/");
                  return (
                    <Link key={s.to} to={s.to}
                      className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] whitespace-nowrap"
                      style={{
                        background: active ? ink : surface,
                        color: active ? "#fff" : muted,
                        border: `1px solid ${active ? ink : border}`,
                      }}>
                      <s.icon className="w-3.5 h-3.5" />{s.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </AppShell>
  );
}

// Shared UI helpers used by child routes
export function Section({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: ReactNode; children: ReactNode }) {
  const { ink, muted } = palette;
  return (
    <section className="mb-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 mb-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: muted }}>{eyebrow}</div>}
          <h2 className="font-serif text-[22px] sm:text-[26px] leading-tight" style={{ color: ink }}>{title}</h2>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "", pad = true, style }: { children: ReactNode; className?: string; pad?: boolean; style?: React.CSSProperties }) {
  const { surface, border } = palette;
  return (
    <div className={`min-w-0 overflow-hidden rounded-3xl ${pad ? "p-4 sm:p-6" : ""} ${className}`} style={{ background: surface, border: `1px solid ${border}`, ...style }}>{children}</div>
  );
}

export function Chip({ children, tone = "default", onClick, active }: { children: ReactNode; tone?: "default" | "success" | "warn" | "info"; onClick?: () => void; active?: boolean }) {
  const { border, muted, ink, surface2 } = palette;
  const bg = tone === "success" ? "#eaf6ea" : tone === "warn" ? "#fff3e6" : tone === "info" ? "#eaf1ff" : (active ? ink : surface2);
  const color = tone === "success" ? "#2f6a37" : tone === "warn" ? "#a35d1a" : tone === "info" ? "#26468f" : (active ? "#fff" : muted);
  return (
    <button onClick={onClick} className="inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] leading-tight" style={{ background: bg, color, border: `1px solid ${active ? "transparent" : border}` }}>
      {children}
    </button>
  );
}

export const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const fmtDay = (ts: number) => {
  const d = new Date(ts); const now = new Date();
  const same = d.toDateString() === now.toDateString();
  const t = new Date(now); t.setDate(now.getDate() + 1);
  if (same) return "Today";
  if (d.toDateString() === t.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
};
