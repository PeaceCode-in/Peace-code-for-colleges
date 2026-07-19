import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Home, Users, Radio, Feather, Plus } from "lucide-react";
import logo from "@/assets/peacecode-logo.png";
import { AppShell } from "@/components/AppShell";
import { cmy } from "@/lib/community-theme";

export const Route = createFileRoute("/community")({ component: CommunityLayout });

function CommunityLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/community",         label: "home",    icon: Home,    exact: true },
    { to: "/community/circles", label: "circles", icon: Users },
    { to: "/community/rooms",   label: "rooms",   icon: Radio },
    { to: "/community/threads", label: "threads", icon: Feather },
  ];

  return (
    <AppShell>
      <div className="w-full font-sans" style={{ color: cmy.ink }}>
        {/* header */}
        <header className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-8 flex items-center justify-between gap-4">
          <Link to="/" className="group flex items-center gap-3 text-[12.5px]" style={{ color: cmy.muted }}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center transition group-hover:-translate-x-0.5"
                  style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
              <ArrowLeft className="w-4 h-4" strokeWidth={1.6}/>
            </span>
            <span className="tracking-[0.28em] uppercase hidden sm:inline">back to today</span>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <img src={logo} alt="" className="w-7 h-7 opacity-80" />
            <div className="text-right">
              <div className="font-serif text-[15px] leading-none">the circle</div>
              <div className="text-[8.5px] tracking-[0.32em] uppercase opacity-50 mt-1">peacecode community</div>
            </div>
          </div>
        </header>

        {/* section nav */}
        <nav className="max-w-[1280px] mx-auto px-5 lg:px-10 mt-6 lg:mt-8 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link key={t.to} to={t.to}
                    className="flex items-center gap-2 h-10 px-4 rounded-full text-[12px] tracking-wide whitespace-nowrap transition"
                    style={{
                      background: active ? cmy.ink : cmy.surface,
                      color: active ? "#F7FAFF" : cmy.ink,
                      border: `1px solid ${active ? cmy.ink : cmy.border}`,
                    }}>
                <Icon className="w-3.5 h-3.5" strokeWidth={1.6}/> {t.label}
              </Link>
            );
          })}
          <Link to="/community/new"
                className="ml-auto flex items-center gap-2 h-10 px-4 rounded-full text-[12px] tracking-wide whitespace-nowrap transition hover:-translate-y-0.5"
                style={{ background: cmy.primary, color: "#F7FAFF", boxShadow: "0 12px 24px -12px rgba(75,108,183,0.55)" }}>
            <Plus className="w-3.5 h-3.5" strokeWidth={1.8}/> offer a thread
          </Link>
        </nav>

        <Outlet />
      </div>
    </AppShell>
  );
}
