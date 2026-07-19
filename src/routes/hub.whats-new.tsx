import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Bug, Zap, Bot, Shield, Palette, Package, Rocket, Bell, Flag, ChevronRight, Beaker } from "lucide-react";
import type { ReactNode } from "react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead, GhostBtn } from "@/components/hub/primitives";
import { releases, CURRENT_VERSION, announcements, BETA_FEATURES, roadmap } from "@/lib/product-hub-store";
import type { ChangeKind } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;

import type { LucideIcon } from "lucide-react";
const KIND_META: Record<ChangeKind, { icon: LucideIcon; label: string; hue: string }> = {
  feature:  { icon: Sparkles, label: "New",         hue: "#7fa5d8" },
  ui:       { icon: Palette,  label: "Interface",   hue: "#c9a0dc" },
  perf:     { icon: Zap,      label: "Performance", hue: "#e88a68" },
  ai:       { icon: Bot,      label: "AI",          hue: "#8a7ec9" },
  security: { icon: Shield,   label: "Security",    hue: "#6b8a5d" },
  fix:      { icon: Bug,      label: "Fix",         hue: "#a0a0a0" },
};

function KindBadge({ kind }: { kind: ChangeKind }) {
  const m = KIND_META[kind];
  return (
    <span className="inline-flex items-center gap-1 rounded-full h-6 px-2.5 text-[10.5px] tracking-wide"
          style={{ background: "var(--pc-surface2)", color: m.hue, border: `1px solid ${border}` }}>
      <m.icon className="w-3 h-3"/> {m.label}
    </span>
  );
}

function WhatsNew() {
  const latest = releases[0];
  const roadmapPreview = roadmap.filter((r) => r.status !== "completed").slice(0, 3);

  return (
    <Page wide>
      <BackBar />
      <PageTitle
        eyebrow={`Version ${CURRENT_VERSION} · ${latest.codename}`}
        title={latest.headline}
        sub={`Released ${new Date(latest.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}. What's inside, in order.`}
        right={
          <div className="flex items-center gap-2">
            <Link to="/hub/roadmap"><GhostBtn><Rocket className="w-3.5 h-3.5"/>Roadmap</GhostBtn></Link>
            <Link to="/hub/beta"><GhostBtn><Beaker className="w-3.5 h-3.5"/>Beta</GhostBtn></Link>
          </div>
        }
      />

      {/* Highlights hero */}
      <Card className="mb-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-60" style={{ background: latest.hue }}/>
        </div>
        <div className="relative">
          <div className="text-[10.5px] tracking-[0.28em] uppercase mb-3" style={{ color: muted }}>Highlights</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {latest.highlights.map((h, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${border}`, backdropFilter: "blur(6px)" }}>
                <div className="text-[10px] tracking-widest uppercase" style={{ color: muted }}>#{i + 1}</div>
                <div className="font-serif text-[16px] mt-1" style={{ color: ink }}>{h}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Grouped changes */}
      <div className="grid gap-3">
        {(["feature", "ui", "ai", "perf", "security", "fix"] as ChangeKind[]).map((k) => {
          const list = latest.changes.filter((c) => c.kind === k);
          if (list.length === 0) return null;
          return (
            <Card key={k}>
              <div className="flex items-center gap-2 mb-3">
                <KindBadge kind={k}/>
                <span className="text-[11px]" style={{ color: muted }}>{list.length} in this release</span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {list.map((c, i) => (
                  <li key={i} className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
                    <div className="font-serif text-[15px]" style={{ color: ink }}>{c.title}</div>
                    {c.detail && <div className="text-[12px] mt-1" style={{ color: muted }}>{c.detail}</div>}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Link to="/hub/changelog/$version" params={{ version: latest.version }}
          className="rounded-full h-11 px-5 text-[12.5px] inline-flex items-center gap-2"
          style={{ background: ink, color: "var(--pc-bg)" }}>
          Full release notes <ChevronRight className="w-3.5 h-3.5"/>
        </Link>
      </div>

      {/* Roadmap preview */}
      <section className="mt-10">
        <SectionHead title="Coming next" sub="A soft peek at what's in progress."
          action={<Link to="/hub/roadmap" className="text-[12px]" style={{ color: primary }}>Full roadmap →</Link>}/>
        <div className="grid gap-3 sm:grid-cols-3">
          {roadmapPreview.map((r) => (
            <Link key={r.id} to="/hub/roadmap" className="rounded-[22px] p-4 transition hover:-translate-y-[1px]"
                  style={{ background: surface, border: `1px solid ${border}` }}>
              <Chip tone="outline">{r.status === "in_dev" ? "In development" : r.status === "now" ? "Now" : r.status === "coming" ? "Coming soon" : "Planned"}</Chip>
              <div className="font-serif text-[16px] mt-2" style={{ color: ink }}>{r.title}</div>
              <div className="text-[12px] mt-1" style={{ color: muted }}>{r.summary}</div>
              <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: border }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${r.progress}%`, background: primary }}/>
              </div>
              <div className="text-[10.5px] mt-1.5" style={{ color: muted }}>{r.progress}% · {r.eta}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Older releases */}
      <section className="mt-10">
        <SectionHead title="Past releases" action={<Link to="/hub/feature-requests" className="text-[12px]" style={{ color: primary }}>Request a feature →</Link>}/>
        <div className="grid gap-2">
          {releases.slice(1).map((r) => (
            <Link key={r.version} to="/hub/changelog/$version" params={{ version: r.version }}
              className="flex items-center gap-4 rounded-2xl p-3 pr-4 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="w-11 h-11 rounded-xl relative overflow-hidden shrink-0" style={{ background: r.hue }}>
                <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full"><circle cx="14" cy="14" r="12" fill="rgba(255,255,255,0.5)"/><circle cx="34" cy="30" r="14" fill="rgba(255,255,255,0.3)"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[14.5px]" style={{ color: ink }}>{r.headline}</div>
                <div className="text-[11px]" style={{ color: muted }}>v{r.version} · {r.codename} · {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: muted }}/>
            </Link>
          ))}
        </div>
      </section>

      {/* Announcements + Beta strip */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHead title="Announcements" action={<Link to="/hub/announcements" className="text-[12px]" style={{ color: primary }}>All →</Link>}/>
          <div className="grid gap-2">
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-2xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <Chip tone="outline">{a.kind}</Chip>
                  <span className="text-[10.5px]" style={{ color: muted }}>{new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
                <div className="font-serif text-[14px]" style={{ color: ink }}>{a.title}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHead title="Beta features" action={<Link to="/hub/beta" className="text-[12px]" style={{ color: primary }}>Join beta →</Link>}/>
          <ul className="grid gap-2">
            {BETA_FEATURES.slice(0, 3).map((b) => (
              <li key={b.id} className="rounded-2xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="font-serif text-[14px]" style={{ color: ink }}>{b.name}</div>
                <div className="text-[11.5px]" style={{ color: muted }}>{b.desc}</div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Page>
  );
}

// silence unused Package, Bell, Flag icons (used in some variants)
const _reserved: ReactNode = null; void _reserved; void Package; void Bell; void Flag;

export const Route = createFileRoute("/hub/whats-new")({ component: WhatsNew });
