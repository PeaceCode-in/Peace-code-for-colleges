import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Users, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { TrendArea } from "@/components/viz/TrendArea";
import { Heatmap } from "@/components/viz/Heatmap";
import { FunnelBars } from "@/components/viz/FunnelBars";
import { Donut } from "@/components/viz/Donut";
import { Sparkbar } from "@/components/viz/Sparkbar";
import { RadialProgress } from "@/components/viz/RadialProgress";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ── URL state ───────────────────────────────────────────────────
const WINDOWS = ["30d", "term", "180d"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_LABEL: Record<WindowKey, string> = { "30d": "30 days", term: "Term", "180d": "180 days" };
const WINDOW_WEEKS: Record<WindowKey, number> = { "30d": 5, term: 16, "180d": 26 };

const SITES = [
  { id: "all",       label: "All sites" },
  { id: "main",      label: "Main campus" },
  { id: "north",     label: "North wing" },
  { id: "hostels",   label: "Hostel clinic" },
  { id: "telehealth",label: "Telehealth" },
] as const;

const search = z.object({
  window: fallback(z.string(), "term").default("term"),
  site:   fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/care/capacity")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Counsellor capacity — PeaceCode for Colleges" },
      { name: "description", content: "Aggregate counsellor workload, utilisation, wait-time and demand forecast signals. k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CapacityPage,
});

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function fmtISO(d: Date) { return d.toISOString().slice(5, 10); }

// Seeded roster (aggregate identifiers only — not real staff)
const ROSTER = [
  { id: "c1", label: "Counsellor A", role: "Senior" },
  { id: "c2", label: "Counsellor B", role: "Senior" },
  { id: "c3", label: "Counsellor C", role: "Associate" },
  { id: "c4", label: "Counsellor D", role: "Associate" },
  { id: "c5", label: "Counsellor E", role: "Associate" },
  { id: "c6", label: "Counsellor F", role: "Trainee" },
  { id: "c7", label: "Counsellor G", role: "Trainee" },
  { id: "c8", label: "External · partner", role: "External" },
];

function weeklySeries(key: string, weeks: number, baseCapacity: number, baseDemand: number) {
  const rand = mulberry32(SEED_ROOT ^ hash(key));
  const today = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (weeks - 1 - i) * 7);
    const midterm = i === Math.floor(weeks * 0.4) ? 0.28 : 0;
    const finals  = i === weeks - 3 ? 0.42 : 0;
    const drift = Math.sin(i / 4) * 0.08;
    const noise = (rand() - 0.5) * 0.1;
    const dem = baseDemand * (1 + drift + midterm + finals + noise);
    const cap = baseCapacity * (1 + (rand() - 0.5) * 0.04);
    return { x: fmtISO(d), capacity: Math.round(cap), demand: Math.round(dem) };
  });
}

function slotHeat(key: string) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:slots`));
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cols = ["09","10","11","12","13","14","15","16","17","18","19"];
  const data = rows.map((_, ri) =>
    cols.map((_, ci) => {
      const midday  = ci >= 3 && ci <= 5 ? 0.35 : 0;
      const evening = ci >= 8 ? 0.5 : 0;
      const fridayDip = ri === 4 && ci >= 6 ? -0.15 : 0;
      const wknd    = ri === 5 ? -0.25 : 0;
      const noise   = rand() * 0.18;
      const v = Math.max(0, Math.min(1, 0.35 + midday + evening + fridayDip + wknd + noise));
      const pct = Math.round(v * 100);
      return { value: Math.round(v * 100) / 100, label: `${rows[ri]} ${cols[ci]}:00 — ${pct}% booked` };
    }),
  );
  return { rows, cols, data };
}

function CapacityPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/care/capacity" });
  const windowKey: WindowKey = (WINDOWS as readonly string[]).includes(s.window) ? (s.window as WindowKey) : "term";
  const site = s.site;
  const siteLabel = SITES.find((x) => x.id === site)?.label ?? "All sites";

  const weeks = WINDOW_WEEKS[windowKey];

  // Site scaling — deterministic cohort size per site for the k-check
  const cohortN = { all: 1240, main: 620, north: 310, hostels: 220, telehealth: 90 }[site] ?? 1240;
  const suppressed = cohortN < N_MIN;

  const baseCap = { all: 220, main: 120, north: 60, hostels: 40, telehealth: 30 }[site] ?? 220;
  const baseDem = baseCap * 0.86;
  const series = useMemo(() => weeklySeries(`${site}:${windowKey}`, weeks, baseCap, baseDem), [site, windowKey, weeks, baseCap, baseDem]);
  const totalCapacity = series.reduce((a, b) => a + b.capacity, 0);
  const totalDemand = series.reduce((a, b) => a + b.demand, 0);
  const utilisation = totalCapacity ? Math.round((totalDemand / totalCapacity) * 100) : 0;
  const currentWeek = series[series.length - 1];
  const priorWeek   = series[series.length - 5] ?? currentWeek;
  const utilCurrent = currentWeek ? Math.round((currentWeek.demand / currentWeek.capacity) * 100) : 0;
  const utilPrior   = priorWeek ? Math.round((priorWeek.demand / priorWeek.capacity) * 100) : utilCurrent;
  const utilDelta   = utilCurrent - utilPrior;

  const funnelRand = mulberry32(SEED_ROOT ^ hash(`${site}:${windowKey}:funnel`));
  const requests   = totalDemand;
  const assigned   = Math.round(requests * (0.94 + funnelRand() * 0.03));
  const scheduled  = Math.round(assigned * (0.88 + funnelRand() * 0.04));
  const attended   = Math.round(scheduled * (0.82 + funnelRand() * 0.05));
  const completed  = Math.round(attended * (0.71 + funnelRand() * 0.05));

  const heat = useMemo(() => slotHeat(`${site}:${windowKey}`), [site, windowKey]);

  const rosterRows = useMemo(() => ROSTER.map((r) => {
    const rand = mulberry32(SEED_ROOT ^ hash(`${r.id}:${site}:${windowKey}`));
    const bars = Array.from({ length: 12 }, () => 40 + Math.floor(rand() * 55));
    const util = bars[bars.length - 1]!;
    const caseload = 8 + Math.floor(rand() * 22);
    const waitDays = +(1.4 + rand() * 5).toFixed(1);
    return { ...r, bars, util, caseload, waitDays };
  }), [site, windowKey]);

  // Wait-time distribution (aggregate)
  const waitRand = mulberry32(SEED_ROOT ^ hash(`${site}:${windowKey}:wait`));
  const waitBuckets = ["<1d","1-3d","4-7d","8-14d","15-30d",">30d"].map((label, i) => {
    const shape = [0.28, 0.32, 0.2, 0.11, 0.06, 0.03][i]!;
    return { label, value: Math.max(3, Math.round(shape * 100 + (waitRand() - 0.5) * 3)) };
  });
  const medianWait = 3.1 + waitRand() * 2.2;

  // Modality mix donut
  const mixRand = mulberry32(SEED_ROOT ^ hash(`${site}:${windowKey}:mix`));
  const modalityMix = [
    { label: "In-person 1:1", value: 40 + Math.floor(mixRand() * 10), color: "var(--pc-primary)" },
    { label: "Telehealth",    value: 26 + Math.floor(mixRand() * 8),  color: "color-mix(in oklab, var(--pc-primary) 55%, var(--pc-surface2))" },
    { label: "Group",         value: 16 + Math.floor(mixRand() * 6),  color: "color-mix(in oklab, var(--pc-primary) 35%, var(--pc-accent-2, #b8563b) 30%)" },
    { label: "Drop-in",       value:  8 + Math.floor(mixRand() * 4),  color: "color-mix(in oklab, var(--pc-accent-2, #b8563b) 55%, var(--pc-primary))" },
    { label: "External",      value:  4 + Math.floor(mixRand() * 3),  color: "var(--pc-accent-2, #b8563b)" },
  ];
  const modalityTotal = modalityMix.reduce((a, b) => a + b.value, 0);

  // Forecast (next 4 weeks)
  const forecastRand = mulberry32(SEED_ROOT ^ hash(`${site}:${windowKey}:forecast`));
  const forecast = Array.from({ length: 4 }, (_, i) => {
    const dem = Math.round(baseDem * (1 + 0.05 * i + forecastRand() * 0.12));
    const cap = Math.round(baseCap * (1 + (forecastRand() - 0.5) * 0.04));
    return { week: `W+${i + 1}`, demand: dem, capacity: cap, gap: dem - cap };
  });

  function setWindow(k: WindowKey) { nav({ search: { ...s, window: k } }); }
  function setSite(id: string)   { nav({ search: { ...s, site: id } }); }

  return (
    <>
      <PageHeader
        eyebrow="Early warning & care"
        title="Counsellor capacity"
        subtitle="Aggregate workload, utilisation, wait time and demand-forecast signals to support staffing decisions ahead of exam weeks. Roster labels are institutional placeholders — no student is named."
      />

      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
          <Group label="Window">
            {WINDOWS.map((k) => (
              <Chip key={k} active={k === windowKey} onClick={() => setWindow(k)}>{WINDOW_LABEL[k]}</Chip>
            ))}
          </Group>
          <Group label="Site">
            {SITES.map((so) => (
              <Chip key={so.id} active={so.id === site} onClick={() => setSite(so.id)}>{so.label}</Chip>
            ))}
          </Group>
          <div className="flex flex-col gap-1.5 min-w-[120px] text-right">
            <Eyebrow>Cohort</Eyebrow>
            <div className="text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>n={cohortN.toLocaleString()}</div>
          </div>
        </div>
      </GlassCard>

      {suppressed ? (
        <GlassCard className="p-10">
          <EmptyState kind="suppressed" title="Hidden to protect anonymity" subtitle={`${siteLabel} cohort is below k=10.`} />
        </GlassCard>
      ) : (
        <>
          <StaggerGrid className="grid grid-cols-12 gap-4">
            {/* Hero utilisation */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>Utilisation · this window</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={utilisation} suffix="%" />
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--pc-surface2)",
                  border: "1px solid var(--pc-border)",
                  color: utilDelta > 0 ? "var(--pc-warn, var(--pc-accent-2))" : utilDelta < 0 ? "var(--pc-good, var(--pc-primary))" : "var(--pc-muted)",
                }}>
                {utilDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(utilDelta > 0 ? "+" : "") + utilDelta}pp vs. 4 wks ago
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Counsellors</div>
                  <div className="mt-0.5 font-mono inline-flex items-center gap-1" style={{ color: "var(--pc-ink)" }}>
                    <Users className="h-3 w-3" /> {ROSTER.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Median wait</div>
                  <div className="mt-0.5 font-mono inline-flex items-center gap-1" style={{ color: "var(--pc-ink)" }}>
                    <Clock className="h-3 w-3" /> {medianWait.toFixed(1)}d
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Every tile aggregates 10+ students.</span>
              </div>
            </FlowCard>

            {/* Capacity vs demand trend */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-6 p-5">
              <SectionTitle title="Capacity vs. demand" subtitle="Booked sessions relative to available slots per week." />
              <div className="mt-3">
                <TrendArea
                  data={series.map((d) => ({ x: d.x, y: d.demand }))}
                  height={200}
                  color="var(--pc-primary)"
                  ariaLabel="Weekly demand vs capacity"
                />
                <div className="mt-2 flex flex-wrap gap-4 text-[11px]" style={{ color: "var(--pc-muted)" }}>
                  <LegendDot color="var(--pc-primary)" label={`Demand · ${totalDemand.toLocaleString()} sessions`} />
                  <LegendDot color="var(--pc-muted)" label={`Capacity · ${totalCapacity.toLocaleString()} slots`} />
                  <span className="ml-auto font-mono" style={{ color: "var(--pc-ink-2)" }}>{utilisation}% avg utilisation</span>
                </div>
              </div>
            </FlowCard>

            {/* Radial gauge */}
            <FlowCard className="col-span-12 md:col-span-12 lg:col-span-3 p-5 flex flex-col items-center justify-center">
              <SectionTitle title="Live utilisation" subtitle="Rolling 7-day window." />
              <div className="mt-4">
                <RadialProgress value={utilCurrent} size={140} stroke={12} sublabel="of capacity" />
              </div>
              <div className="mt-3 text-[11.5px] text-center" style={{ color: "var(--pc-muted)" }}>
                {utilCurrent >= 90
                  ? "At capacity — recommend release valves this week."
                  : utilCurrent >= 75
                    ? "Healthy load. Monitor for spikes."
                    : "Slack available — safe to run outreach."}
              </div>
            </FlowCard>

            {/* Pipeline funnel */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Session pipeline" subtitle="Requests → assigned → scheduled → attended → completed." />
              <div className="mt-3">
                <FunnelBars
                  steps={[
                    { label: "Requests",  value: requests },
                    { label: "Assigned",  value: assigned },
                    { label: "Scheduled", value: scheduled },
                    { label: "Attended",  value: attended },
                    { label: "Completed", value: completed },
                  ]}
                  color="var(--pc-primary)"
                  ariaLabel="Counsellor session pipeline"
                />
              </div>
            </FlowCard>

            {/* Slot heatmap */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <SectionTitle title="Slot demand · day × hour" subtitle="Booked share of counsellor slots. Evenings dominate; Fri late & Sat show slack." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap rows={heat.rows} cols={heat.cols} data={heat.data} min={0} max={1} cellSize={26} ariaLabel="Slot demand heatmap" />
              </div>
            </FlowCard>

            {/* Wait times */}
            <FlowCard className="col-span-12 lg:col-span-4 p-5">
              <SectionTitle title="Wait to first appointment" subtitle="Distribution of request → first appointment." />
              <ul className="mt-3 space-y-1.5">
                {waitBuckets.map((w) => {
                  const max = Math.max(...waitBuckets.map((x) => x.value));
                  return (
                    <li key={w.label} className="flex items-center gap-2 text-[11.5px]">
                      <span className="w-14 font-mono" style={{ color: "var(--pc-muted)" }}>{w.label}</span>
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                        <div className="h-full" style={{ width: `${(w.value / max) * 100}%`, background: "var(--pc-primary)" }} />
                      </div>
                      <span className="w-8 text-right font-mono" style={{ color: "var(--pc-ink)" }}>{w.value}%</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                Target: <span style={{ color: "var(--pc-ink-2)" }}>≥80% within 7 days.</span>
              </div>
            </FlowCard>

            {/* Modality mix */}
            <FlowCard className="col-span-12 lg:col-span-4 p-5">
              <SectionTitle title="Session modality mix" subtitle="Share of delivered sessions by format." />
              <div className="mt-3 flex items-center gap-3">
                <Donut slices={modalityMix} size={128} stroke={14} centerLabel={`${modalityTotal}%`} centerSub="mix" ariaLabel="Modality mix" />
                <ul className="flex-1 min-w-0 space-y-1">
                  {modalityMix.map((sl) => (
                    <li key={sl.label} className="flex items-center gap-2 text-[11px]">
                      <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: sl.color }} />
                      <span className="truncate" style={{ color: "var(--pc-ink-2)" }}>{sl.label}</span>
                      <span className="ml-auto font-mono" style={{ color: "var(--pc-muted)" }}>
                        {modalityTotal ? Math.round((sl.value / modalityTotal) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FlowCard>

            {/* Forecast */}
            <FlowCard className="col-span-12 lg:col-span-4 p-5">
              <SectionTitle title="4-week demand forecast" subtitle="Seeded projection based on rolling trend and academic calendar." />
              <ul className="mt-3 space-y-2">
                {forecast.map((f) => {
                  const short = f.gap > 0;
                  return (
                    <li key={f.week} className="flex items-center gap-3 text-[12px]">
                      <span className="w-10 font-mono" style={{ color: "var(--pc-muted)" }}>{f.week}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{f.demand}</span>
                          <span className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>demand · cap {f.capacity}</span>
                        </div>
                        <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                          <div className="h-full" style={{ width: `${Math.min(100, (f.demand / f.capacity) * 100)}%`, background: short ? "var(--pc-accent-2, #b8563b)" : "var(--pc-primary)" }} />
                        </div>
                      </div>
                      <span
                        className="w-14 text-right font-mono text-[11px] inline-flex items-center justify-end gap-1"
                        style={{ color: short ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-good, var(--pc-primary))" }}
                      >
                        {short && <AlertTriangle className="h-3 w-3" />}
                        {f.gap > 0 ? `+${f.gap}` : f.gap}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                Positive gap = demand over capacity; plan release valves or borrowed slots.
              </div>
            </FlowCard>

            {/* Roster */}
            <FlowCard className="col-span-12 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <SectionTitle title="Counsellor workload · last 12 weeks" subtitle="Aggregate utilisation, active caseload, and current wait per counsellor." />
                <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "var(--pc-muted)" }}>
                  <Users className="h-3 w-3" /> {rosterRows.length} counsellors
                </span>
              </div>
              <ul className="mt-3">
                {rosterRows.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3 py-2"
                    style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{r.label}</div>
                      <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{r.role} · caseload {r.caseload} · wait {r.waitDays}d</div>
                    </div>
                    <Sparkbar values={r.bars} width={200} height={22} color="var(--pc-primary)" ariaLabel={`${r.label} weekly utilisation`} />
                    <span
                      className="w-16 text-right text-[12px] font-mono"
                      style={{ color: r.util >= 90 ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-ink-2)" }}
                    >
                      {r.util}%<span className="text-[10px]" style={{ color: "var(--pc-muted)" }}> util</span>
                    </span>
                  </li>
                ))}
              </ul>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            Aggregate only. Counsellor labels are institutional placeholders; no student is named or countable across cells.
          </Reveal>
        </>
      )}
    </>
  );
}

// ── UI atoms ────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
      {children}
    </div>
  );
}
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>{title}</div>
      {subtitle && <div className="text-[11.5px] mt-0.5" style={{ color: "var(--pc-muted)" }}>{subtitle}</div>}
    </div>
  );
}
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="text-[12px] px-2.5 py-1 rounded-full disabled:opacity-60"
      style={{
        background: active ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface2))" : "var(--pc-surface)",
        color: active ? "var(--pc-accent, var(--pc-primary))" : "var(--pc-ink-2)",
        border: active ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "1px solid var(--pc-border)",
      }}
    >
      {children}
    </button>
  );
}
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}
