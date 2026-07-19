import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Bug, Zap, Bot, Shield, Palette } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead } from "@/components/hub/primitives";
import { releaseByVersion, releases } from "@/lib/product-hub-store";
import type { ChangeKind } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, surface } = palette;

const K: Record<ChangeKind, { icon: LucideIcon; label: string; hue: string }> = {
  feature:  { icon: Sparkles, label: "New feature", hue: "#7fa5d8" },
  ui:       { icon: Palette,  label: "Interface",   hue: "#c9a0dc" },
  perf:     { icon: Zap,      label: "Performance", hue: "#e88a68" },
  ai:       { icon: Bot,      label: "AI",          hue: "#8a7ec9" },
  security: { icon: Shield,   label: "Security",    hue: "#6b8a5d" },
  fix:      { icon: Bug,      label: "Fix",         hue: "#a0a0a0" },
};

function ChangelogDetail() {
  const { version } = Route.useParams();
  const r = releaseByVersion(version);
  if (!r) throw notFound();
  const idx = releases.findIndex((x) => x.version === version);
  const prev = releases[idx + 1];
  const next = releases[idx - 1];

  return (
    <Page>
      <BackBar to="/hub/whats-new" label="What's new"/>
      <PageTitle
        eyebrow={`v${r.version} · ${r.codename}`}
        title={r.headline}
        sub={`Released ${new Date(r.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} · ${r.type} release`}
      />

      <Card className="mb-6 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-60" style={{ background: r.hue }}/>
        </div>
        <div className="relative">
          <div className="text-[10.5px] tracking-[0.28em] uppercase mb-3" style={{ color: muted }}>Highlights</div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {r.highlights.map((h, i) => (
              <li key={i} className="rounded-2xl p-3.5" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="text-[10px] tracking-widest uppercase" style={{ color: muted }}>#{i + 1}</div>
                <div className="font-serif text-[15px] mt-1" style={{ color: ink }}>{h}</div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {(Object.keys(K) as ChangeKind[]).map((k) => {
        const list = r.changes.filter((c) => c.kind === k);
        if (list.length === 0) return null;
        const Meta = K[k];
        return (
          <Card key={k} className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: surface2, color: Meta.hue, border: `1px solid ${border}` }}>
                <Meta.icon className="w-4 h-4"/>
              </span>
              <div className="font-serif text-[16px]" style={{ color: ink }}>{Meta.label}</div>
              <span className="text-[11px]" style={{ color: muted }}>· {list.length}</span>
            </div>
            <ul className="grid gap-2">
              {list.map((c, i) => (
                <li key={i} className="rounded-xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <div className="text-[13.5px]" style={{ color: ink }}>{c.title}</div>
                  {c.detail && <div className="text-[12px] mt-0.5" style={{ color: muted }}>{c.detail}</div>}
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {r.knownIssues.length > 0 && (
        <Card className="mb-4">
          <SectionHead title="Known issues"/>
          <ul className="grid gap-2">
            {r.knownIssues.map((k, i) => (
              <li key={i} className="text-[13px] flex gap-2" style={{ color: muted }}>
                <span>•</span><span>{k}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {r.devNotes && (
        <Card className="mb-4">
          <SectionHead title="Developer notes"/>
          <p className="text-[13px] leading-relaxed" style={{ color: muted }}>{r.devNotes}</p>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3 mt-6">
        {prev ? (
          <Link to="/hub/changelog/$version" params={{ version: prev.version }}
            className="rounded-2xl p-3 flex-1 min-w-0" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10.5px] tracking-widest uppercase" style={{ color: muted }}>Older</div>
            <div className="text-[13px] truncate" style={{ color: ink }}>v{prev.version} · {prev.codename}</div>
          </Link>
        ) : <span className="flex-1"/>}
        {next ? (
          <Link to="/hub/changelog/$version" params={{ version: next.version }}
            className="rounded-2xl p-3 flex-1 text-right min-w-0" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10.5px] tracking-widest uppercase" style={{ color: muted }}>Newer</div>
            <div className="text-[13px] truncate inline-flex items-center gap-1" style={{ color: primary }}>v{next.version} · {next.codename} <ChevronRight className="w-3.5 h-3.5"/></div>
          </Link>
        ) : <span className="flex-1"/>}
      </div>

      <div className="mt-6">
        <Chip tone="outline">You're viewing an older release. <Link to="/hub/whats-new" className="ml-1 underline" style={{ color: primary }}>Latest →</Link></Chip>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/hub/changelog/$version")({ component: ChangelogDetail });
