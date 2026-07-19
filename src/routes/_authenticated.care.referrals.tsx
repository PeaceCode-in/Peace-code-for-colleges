import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { TrendingUp, TrendingDown, Clock, Inbox } from "lucide-react";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { FunnelBars } from "@/components/viz/FunnelBars";
import { TrendArea } from "@/components/viz/TrendArea";
import { ChordMini } from "@/components/viz/ChordMini";
import { Donut } from "@/components/viz/Donut";
import { Heatmap } from "@/components/viz/Heatmap";
import { Sparkbar } from "@/components/viz/Sparkbar";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, cohortMatrix } from "@/lib/data/seed";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ── URL state ───────────────────────────────────────────────────
const WINDOWS = ["30d", "term", "180d"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_LABEL: Record<WindowKey, string> = { "30d": "30 days", term: "Term", "180d": "180 days" };
const WINDOW_WEEKS: Record<WindowKey, number> = { "30d": 5, term: 16, "180d": 26 };

const search = z.object({
  window: fallback(z.string(), "term").default("term"),
  source: fallback(z.string(), "all").default("all"),
  dept:   fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/care/referrals")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Referral pipeline — PeaceCode for Colleges" },
      { name: "description", content: "Anonymous self-referral pipeline from intake through triage to first appointment. Aggregate-only, k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReferralsPage,
});

// ── Helpers ─────────────────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function fmtISO(d: Date) { return d.toISOString().slice(5, 10); }

const SOURCES = [
  { id: "all",       label: "All sources" },
  { id: "self",      label: "Self-referral" },
  { id: "screen",    label: "Screening (PHQ/GAD)" },
  { id: "faculty",   label: "Faculty" },
  { id: "residence", label: "Residence" },
  { id: "peer",      label: "Peer" },
] as const;

const ROUTING_NODES = [
  { id: "intake",   label: "Intake" },
  { id: "triage",   label: "Triage" },
  { id: "urgent",   label: "Urgent" },
  { id: "standard", label: "Standard" },
  { id: "grouped",  label: "Group" },
  { id: "external", label: "External" },
];

function weeklyVolume(key: string, weeks: number): { x: string; y: number }[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:vol`));
  const today = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const wi = i;
    const d = new Date(today);
    d.setDate(today.getDate() - (weeks - 1 - i) * 7);
    const midterm = wi === Math.floor(weeks * 0.4) ? 22 : 0;
    const finals  = wi === weeks - 3 ? 30 : 0;
    const base = 34 + rand() * 12;
    const drift = Math.sin(wi / 3) * 5;
    return { x: fmtISO(d), y: Math.max(10, Math.round(base + drift + midterm + finals + (rand() - 0.5) * 6)) };
  });
}

function waitBuckets(key: string) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:wait`));
  const buckets = ["<1d", "1-3d", "4-7d", "8-14d", "15-30d", ">30d"];
  const shape = [0.32, 0.28, 0.18, 0.12, 0.07, 0.03];
  const total = 100;
  return buckets.map((b, i) => ({
    label: b,
    value: Math.max(4, Math.round(shape[i]! * total + (rand() - 0.5) * 3)),
  }));
}

function dayHourIntake(key: string) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:heat`));
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cols = Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? String(i) : ""));
  const data = rows.map((_, ri) =>
    Array.from({ length: 24 }, (_, ci) => {
      const evening = ci >= 20 && ci <= 23 ? 0.45 : 0;
      const midday  = ci >= 12 && ci <= 14 ? 0.28 : 0;
      const sunPre  = ri === 6 && ci >= 18 ? 0.32 : 0;
      const wknd    = (ri === 5 || ri === 6) && ci >= 10 && ci <= 14 ? 0.18 : 0;
      const noise   = rand() * 0.14;
      const v = Math.min(1, evening + midday + sunPre + wknd + noise);
      return { value: Math.round(v * 100) / 100, label: `${rows[ri]} ${String(ci).padStart(2, "0")}:00 — ${(v * 100).toFixed(0)}% of intake` };
    }),
  );
  return { rows, cols, data };
}

function ReferralsPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/care/referrals" });
  const windowKey: WindowKey = (WINDOWS as readonly string[]).includes(s.window) ? (s.window as WindowKey) : "term";
  const source = s.source;
  const dept = s.dept;

  const matrix = useMemo(() => cohortMatrix(), []);
  const deptOptions = [
    { id: "all", name: "All institution", n: Object.values(matrix).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0) },
    ...SEED_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, n: Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0) })),
  ];
  const selectedDept = deptOptions.find((d) => d.id === dept) ?? deptOptions[0]!;
  const suppressed = selectedDept.n < N_MIN;

  const weeks = WINDOW_WEEKS[windowKey];
  const volume = useMemo(() => weeklyVolume(`${dept}:${source}:${windowKey}`, weeks), [dept, source, windowKey, weeks]);
  const totalReferrals = volume.reduce((a, b) => a + b.y, 0);
  const currentWeek = volume[volume.length - 1]?.y ?? 0;
  const priorWeek   = volume[volume.length - 5]?.y ?? currentWeek;
  const weeklyDelta = currentWeek - priorWeek;

  // Funnel
  const rand = mulberry32(SEED_ROOT ^ hash(`${dept}:${source}:${windowKey}:funnel`));
  const intake     = totalReferrals;
  const triaged    = Math.round(intake * (0.93 + rand() * 0.04));
  const routed     = Math.round(triaged * (0.86 + rand() * 0.05));
  const scheduled  = Math.round(routed * (0.79 + rand() * 0.06));
  const attended   = Math.round(scheduled * (0.72 + rand() * 0.07));
  const closed     = Math.round(attended * (0.58 + rand() * 0.06));

  // Routing chord
  const routingLinks = [
    { from: "intake",   to: "triage",   weight: triaged },
    { from: "triage",   to: "urgent",   weight: Math.round(routed * 0.18) },
    { from: "triage",   to: "standard", weight: Math.round(routed * 0.56) },
    { from: "triage",   to: "grouped",  weight: Math.round(routed * 0.16) },
    { from: "triage",   to: "external", weight: Math.round(routed * 0.10) },
    { from: "urgent",   to: "external", weight: Math.round(routed * 0.03) },
  ];

  // Wait time buckets
  const waits = useMemo(() => waitBuckets(`${dept}:${source}:${windowKey}`), [dept, source, windowKey]);
  const medianWaitDays = 3.4 + mulberry32(SEED_ROOT ^ hash(`${dept}:${windowKey}:med`))() * 2.4;

  // Source mix donut
  const mixRand = mulberry32(SEED_ROOT ^ hash(`${dept}:${windowKey}:mix`));
  const sourceMix = [
    { label: "Self-referral",  value: 42 + Math.floor(mixRand() * 12), color: "var(--pc-primary)" },
    { label: "Screening",      value: 22 + Math.floor(mixRand() * 10), color: "color-mix(in oklab, var(--pc-primary) 55%, var(--pc-surface2))" },
    { label: "Faculty",        value: 14 + Math.floor(mixRand() * 6),  color: "color-mix(in oklab, var(--pc-primary) 35%, var(--pc-accent-2, #b8563b) 30%)" },
    { label: "Residence",      value: 10 + Math.floor(mixRand() * 5),  color: "color-mix(in oklab, var(--pc-accent-2, #b8563b) 55%, var(--pc-primary))" },
    { label: "Peer",           value:  6 + Math.floor(mixRand() * 4),  color: "var(--pc-accent-2, #b8563b)" },
  ];
  const mixTotal = sourceMix.reduce((a, b) => a + b.value, 0);

  // Intake day×hour
  const intakeHeat = useMemo(() => dayHourIntake(`${dept}:${windowKey}`), [dept, windowKey]);

  // Outcomes bar
  const outRand = mulberry32(SEED_ROOT ^ hash(`${dept}:${windowKey}:out`));
  const outcomes = [
    { label: "Resolved",       value: Math.round(closed * (0.62 + outRand() * 0.06)) },
    { label: "Ongoing",        value: Math.round(closed * (0.22 + outRand() * 0.04)) },
    { label: "Referred out",   value: Math.round(closed * (0.10 + outRand() * 0.03)) },
    { label: "Did-not-attend", value: Math.round(closed * (0.06 + outRand() * 0.02)) },
  ];
  const outcomeTotal = outcomes.reduce((a, b) => a + b.value, 0);

  // Weekly sparkbars by source
  const sourceSpark = SOURCES.filter((so) => so.id !== "all").map((so) => {
    const r = mulberry32(SEED_ROOT ^ hash(`${so.id}:${dept}:${windowKey}`));
    const bars = Array.from({ length: 12 }, () => 4 + Math.floor(r() * 12));
    return { id: so.id, label: so.label, bars, total: bars.reduce((a, b) => a + b, 0) };
  });

  function setWindow(k: WindowKey) { nav({ search: { ...s, window: k } }); }
  function setSource(id: string) { nav({ search: { ...s, source: id } }); }
  function setDept(id: string) { nav({ search: { ...s, dept: id } }); }

  return (
    <>
      <PageHeader
        eyebrow="Early warning & care"
        title="Referral pipeline"
        subtitle="Anonymous flow from intake through triage to first appointment. Every stage is aggregate; k ≥ 10 enforced across every source and program."
      />

      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_auto_1fr_auto] md:items-start">
          <Group label="Window">
            {WINDOWS.map((k) => (
              <Chip key={k} active={k === windowKey} onClick={() => setWindow(k)}>{WINDOW_LABEL[k]}</Chip>
            ))}
          </Group>
          <Group label="Source">
            {SOURCES.map((so) => (
              <Chip key={so.id} active={so.id === source} onClick={() => setSource(so.id)}>{so.label}</Chip>
            ))}
          </Group>
          <Group label="Segment">
            {deptOptions.map((d) => {
              const dim = d.n < N_MIN;
              return (
                <Chip key={d.id} active={d.id === dept} disabled={dim && d.id !== dept} onClick={() => setDept(d.id)}>
                  {d.name}{dim && " · hidden"}
                </Chip>
              );
            })}
          </Group>
          <div className="flex flex-col gap-1.5 min-w-[120px] text-right">
            <Eyebrow>Cohort</Eyebrow>
            <div className="text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>
              n={selectedDept.n.toLocaleString()}
            </div>
          </div>
        </div>
      </GlassCard>

      {suppressed ? (
        <GlassCard className="p-10">
          <EmptyState kind="suppressed" title="Hidden to protect anonymity" subtitle={`${selectedDept.name} cohort is below k=10.`} />
        </GlassCard>
      ) : (
        <>
          <StaggerGrid className="grid grid-cols-12 gap-4">
            {/* Hero */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>Referrals · this window</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={totalReferrals} decimals={0} />
                </span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>intakes</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--pc-surface2)",
                  border: "1px solid var(--pc-border)",
                  color: weeklyDelta > 0 ? "var(--pc-warn, var(--pc-accent-2))" : weeklyDelta < 0 ? "var(--pc-good, var(--pc-primary))" : "var(--pc-muted)",
                }}>
                {weeklyDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(weeklyDelta > 0 ? "+" : "") + weeklyDelta.toFixed(0)} vs. 4 wks ago
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Median wait</div>
                  <div className="mt-0.5 font-mono inline-flex items-center gap-1" style={{ color: "var(--pc-ink)" }}>
                    <Clock className="h-3 w-3" /> {medianWaitDays.toFixed(1)}d
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Attend rate</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{scheduled ? Math.round((attended / scheduled) * 100) : 0}%</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Every stage aggregates 10+ students.</span>
              </div>
            </FlowCard>

            {/* Volume trend */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-6 p-5">
              <SectionTitle title="Weekly referral volume" subtitle="New intakes per week. Spikes around mid-terms and finals are typical." />
              <div className="mt-3">
                <TrendArea data={volume} height={200} color="var(--pc-primary)" ariaLabel="Weekly referral volume" />
              </div>
            </FlowCard>

            {/* Source mix */}
            <FlowCard className="col-span-12 md:col-span-12 lg:col-span-3 p-5">
              <SectionTitle title="Referral source mix" subtitle="Share of intakes by origin." />
              <div className="mt-3 flex items-center gap-3">
                <Donut slices={sourceMix} size={128} stroke={14} centerLabel={`${mixTotal}%`} centerSub="mix" ariaLabel="Referral source mix" />
                <ul className="flex-1 min-w-0 space-y-1">
                  {sourceMix.map((sl) => (
                    <li key={sl.label} className="flex items-center gap-2 text-[11px]">
                      <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: sl.color }} />
                      <span className="truncate" style={{ color: "var(--pc-ink-2)" }}>{sl.label}</span>
                      <span className="ml-auto font-mono" style={{ color: "var(--pc-muted)" }}>
                        {mixTotal ? Math.round((sl.value / mixTotal) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FlowCard>

            {/* Funnel */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Pipeline funnel" subtitle="Stage-over-stage retention from first intake to case closure." />
              <div className="mt-3">
                <FunnelBars
                  steps={[
                    { label: "Intake",    value: intake },
                    { label: "Triaged",   value: triaged },
                    { label: "Routed",    value: routed },
                    { label: "Scheduled", value: scheduled },
                    { label: "Attended",  value: attended },
                    { label: "Closed",    value: closed },
                  ]}
                  color="var(--pc-primary)"
                  ariaLabel="Referral pipeline funnel"
                />
              </div>
            </FlowCard>

            {/* Routing chord */}
            <FlowCard className="col-span-12 lg:col-span-4 p-5">
              <SectionTitle title="Triage routing" subtitle="How triaged referrals distribute across care tracks." />
              <div className="mt-3 flex justify-center">
                <ChordMini nodes={ROUTING_NODES} links={routingLinks} size={240} ariaLabel="Triage routing chord" />
              </div>
            </FlowCard>

            {/* Wait times */}
            <FlowCard className="col-span-12 lg:col-span-3 p-5">
              <SectionTitle title="Time to first contact" subtitle="Distribution of intake → first appointment." />
              <ul className="mt-3 space-y-1.5">
                {waits.map((w) => {
                  const max = Math.max(...waits.map((x) => x.value));
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

            {/* Intake heatmap */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <SectionTitle title="When intakes arrive" subtitle="Day of week × hour of day. Evenings and Sunday nights dominate." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap rows={intakeHeat.rows} cols={intakeHeat.cols} data={intakeHeat.data} min={0} max={1} cellSize={22} ariaLabel="Intake heatmap" />
              </div>
            </FlowCard>

            {/* Outcomes */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Closed case outcomes" subtitle="How closed cases resolved this window." />
              <ul className="mt-3 space-y-2">
                {outcomes.map((o) => (
                  <li key={o.label} className="flex items-center gap-3 text-[12px]">
                    <span className="w-32" style={{ color: "var(--pc-ink-2)" }}>{o.label}</span>
                    <div className="flex-1 h-4 rounded-md relative overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                      <div className="h-full rounded-md flex items-center px-2 font-mono text-[10px]"
                        style={{
                          width: `${outcomeTotal ? (o.value / outcomeTotal) * 100 : 0}%`,
                          background: "var(--pc-primary)",
                          color: "var(--pc-primary-ink, #fff)",
                        }}>
                        {o.value}
                      </div>
                    </div>
                    <span className="w-10 text-right font-mono" style={{ color: "var(--pc-ink)" }}>
                      {outcomeTotal ? Math.round((o.value / outcomeTotal) * 100) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
            </FlowCard>

            {/* Source sparks */}
            <FlowCard className="col-span-12 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <SectionTitle title="Volume by source · last 12 weeks" subtitle="Weekly intake bars per referral source." />
                <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "var(--pc-muted)" }}>
                  <Inbox className="h-3 w-3" /> {sourceSpark.length} sources
                </span>
              </div>
              <ul className="mt-3">
                {sourceSpark.map((f, i) => (
                  <li key={f.id} className="flex items-center gap-3 py-2"
                    style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{f.label}</div>
                      <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{f.total.toLocaleString()} intakes · 12 wks</div>
                    </div>
                    <Sparkbar values={f.bars} width={200} height={22} color="var(--pc-primary)" ariaLabel={`${f.label} weekly bars`} />
                    <span className="w-16 text-right text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>
                      {Math.max(...f.bars)}<span className="text-[10px]" style={{ color: "var(--pc-muted)" }}> peak</span>
                    </span>
                  </li>
                ))}
              </ul>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            Aggregate only. No student is named or countable across sources; every stage aggregates ≥10 people.
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
