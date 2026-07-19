import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, TreePine, Sparkles, Users } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadEntries, loadCommunity, computeForest } from "@/lib/gratitude-store";

export const Route = createFileRoute("/gratitude/forest")({
  head: () => ({ meta: [{ title: "Peace Forest — Gratitude" }] }),
  component: ForestPage,
});

function ForestPage() {
  const { ink, muted, border, primary, surface, surface2 } = palette;
  const [entries, setEntries] = useState(() => loadEntries());
  useEffect(() => { setEntries(loadEntries()); }, []);

  const forest = useMemo(() => computeForest(entries), [entries]);
  const community = useMemo(() => loadCommunity(), []);
  const recentBloom = community.slice(0, 5);
  const topContributors = useMemo(() => {
    const m = new Map<string, number>();
    community.forEach((c) => { if (!c.anonymous && c.authorName) m.set(c.authorName, (m.get(c.authorName) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [community]);

  const milestones = [
    { n: 1000,  label: "one thousand seeds planted" },
    { n: 10000, label: "ten thousand entries" },
    { n: 25000, label: "quarter forest" },
    { n: 50000, label: "half the sky" },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/gratitude" className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 mb-6" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3" /> back
        </Link>

        <h1 className="font-serif italic text-4xl sm:text-5xl leading-[1.05]" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
          the peace forest
        </h1>
        <p className="mt-3 max-w-lg text-sm" style={{ color: muted }}>every student's tree, standing near yours.</p>

        {/* forest visualization */}
        <div className="mt-6 rounded-[32px] overflow-hidden relative" style={{ background: "linear-gradient(180deg,#EAF3FF 0%,#D5E5FA 100%)", border: `1px solid ${border}` }}>
          <ForestSVG count={80} />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: "rgba(29,42,68,0.65)" }}>forest health</div>
              <div className="font-serif italic text-3xl" style={{ color: "#1D2A44", fontFamily: "'Fraunces', serif" }}>{Math.round(forest.health * 100)}%</div>
            </div>
            <div className="flex gap-6 text-[11px]" style={{ color: "rgba(29,42,68,0.7)" }}>
              <div><span className="block text-[10px] tracking-[0.24em] uppercase opacity-60">trees</span>{forest.totalTrees.toLocaleString()}</div>
              <div><span className="block text-[10px] tracking-[0.24em] uppercase opacity-60">entries</span>{forest.totalEntries.toLocaleString()}</div>
              <div><span className="block text-[10px] tracking-[0.24em] uppercase opacity-60">bloomed</span>{forest.bloomed.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-3">
          <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: muted }}>recently bloomed</div>
            <ul className="space-y-2.5">
              {recentBloom.map((c) => (
                <li key={c.id} className="rounded-2xl p-3.5" style={{ background: surface2 }}>
                  <div className="text-[13px] leading-relaxed" style={{ color: ink }}>{c.body}</div>
                  <div className="text-[11px] mt-1 opacity-60" style={{ color: muted }}>{c.anonymous ? "anonymous" : c.authorName} · {c.category}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: muted }}>top contributors</div>
              <ul className="space-y-2 text-[13px]">
                {topContributors.map(([name, n], i) => (
                  <li key={name} className="flex items-center gap-3">
                    <span className="w-5 text-[11px] opacity-60" style={{ color: muted }}>{i + 1}</span>
                    <span style={{ color: ink }}>{name}</span>
                    <span className="ml-auto text-[11px]" style={{ color: muted }}>{n} notes</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: muted }}>milestones</div>
              <ul className="space-y-2 text-[13px]">
                {milestones.map((m) => {
                  const reached = forest.totalEntries >= m.n;
                  return (
                    <li key={m.n} className="flex items-center gap-2" style={{ color: reached ? ink : muted, opacity: reached ? 1 : 0.7 }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: reached ? primary : muted }} />
                      <span>{m.label}</span>
                      <span className="ml-auto text-[11px] tabular-nums">{reached ? "reached" : `${m.n.toLocaleString()}`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ForestSVG({ count }: { count: number }) {
  const trees = Array.from({ length: count });
  return (
    <svg viewBox="0 0 800 320" className="w-full aspect-[5/2]" preserveAspectRatio="xMidYMid slice">
      <ellipse cx="400" cy="300" rx="600" ry="40" fill="#C7DBAF" opacity="0.5" />
      {trees.map((_, i) => {
        const x = (i * 47) % 800;
        const row = Math.floor(i / 16);
        const y = 260 - row * 40 + ((i * 13) % 12);
        const scale = 0.6 + ((i % 5) * 0.15) - row * 0.05;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
            <rect x="-2" y="0" width="4" height="18" fill="#5A3B22" />
            <circle cx="0" cy="-4" r="14" fill={i % 7 === 0 ? "#EFC050" : i % 4 === 0 ? "#7BB56A" : "#5FA050"} opacity="0.92" />
          </g>
        );
      })}
    </svg>
  );
}
