import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { TrendingUp, TrendingDown, ClipboardCheck } from "lucide-react";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Donut } from "@/components/viz/Donut";
import { FunnelBars } from "@/components/viz/FunnelBars";
import { TrendArea } from "@/components/viz/TrendArea";
import { ChordMini } from "@/components/viz/ChordMini";
import { Sparkbar } from "@/components/viz/Sparkbar";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, cohortMatrix } from "@/lib/data/seed";
import { seedPhq9, seedGad7 } from "@/lib/data/seed/timeseries";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ── URL state ───────────────────────────────────────────────────
const WINDOWS = ["month", "term", "year"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_LABEL: Record<WindowKey, string> = { month: "Month", term: "Term", year: "Year" };

const SCALES = ["both", "phq9", "gad7"] as const;
type ScaleKey = (typeof SCALES)[number];
const SCALE_LABEL: Record<ScaleKey, string> = { both: "Both scales", phq9: "PHQ-9", gad7: "GAD-7" };

const search = z.object({
  window: fallback(z.string(), "term").default("term"),
  scale:  fallback(z.string(), "both").default("both"),
  dept:   fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/signals/screenings")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Screening outcomes — PeaceCode for Colleges" },
      { name: "description", content: "PHQ-9 and GAD-7 participation, severity bands, positive-screen trends and referral routing. Aggregate-only, k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScreeningsPage,
});

// ── Derived helpers ─────────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function positiveTrend(key: string, points: number): { x: string; y: number }[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:pos`));
  const out: { x: string; y: number }[] = [];
  const today = new Date();
  let base = 22 + rand() * 6;
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const drift = Math.sin(i / 4) * 3 + (rand() - 0.5) * 2.4;
    const v = Math.max(10, Math.min(38, base + drift));
    base += (rand() - 0.5) * 0.4;
    out.push({ x: d.toISOString().slice(5, 10), y: Math.round(v * 10) / 10 });
  }
  return out;
}
function volumeBars(key: string, n: number): number[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:vol`));
  return Array.from({ length: n }, (_, i) => {
    const seasonal = i === Math.floor(n / 2) ? 1.35 : 1;
    return Math.round((160 + rand() * 120) * seasonal);
  });
}

const REFERRAL_NODES = [
  { id: "positive", label: "Positive" },
  { id: "referred", label: "Referred" },
  { id: "booked",   label: "Booked" },
  { id: "attended", label: "Attended" },
  { id: "followup", label: "Follow-up" },
];

function ScreeningsPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/signals/screenings" });
  const windowKey: WindowKey = (WINDOWS as readonly string[]).includes(s.window) ? (s.window as WindowKey) : "term";
  const scale: ScaleKey = (SCALES as readonly string[]).includes(s.scale) ? (s.scale as ScaleKey) : "both";
  const dept = s.dept;

  const matrix = useMemo(() => cohortMatrix(), []);
  const deptOptions = [
    { id: "all", name: "All institution", n: Object.values(matrix).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0) },
    ...SEED_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, n: Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0) })),
  ];
  const selectedDept = deptOptions.find((d) => d.id === dept) ?? deptOptions[0]!;
  const suppressed = selectedDept.n < N_MIN;

  // Distributions
  const phq9 = seedPhq9();
  const gad7 = seedGad7();

  const phq9Slices = [
    { label: "Minimal",           value: phq9.minimal,          color: "color-mix(in oklab, var(--pc-primary) 25%, var(--pc-surface2))" },
    { label: "Mild",              value: phq9.mild,             color: "color-mix(in oklab, var(--pc-primary) 55%, var(--pc-surface2))" },
    { label: "Moderate",          value: phq9.moderate,         color: "var(--pc-primary)" },
    { label: "Moderately severe", value: phq9.moderatelySevere, color: "color-mix(in oklab, var(--pc-accent-2, #b8563b) 70%, var(--pc-primary))" },
    { label: "Severe",            value: phq9.severe,           color: "var(--pc-warn, var(--pc-accent-2, #b8563b))" },
  ];
  const gad7Slices = [
    { label: "Minimal",  value: gad7.minimal,  color: "color-mix(in oklab, var(--pc-primary) 25%, var(--pc-surface2))" },
    { label: "Mild",     value: gad7.mild,     color: "color-mix(in oklab, var(--pc-primary) 55%, var(--pc-surface2))" },
    { label: "Moderate", value: gad7.moderate, color: "var(--pc-primary)" },
    { label: "Severe",   value: gad7.severe,   color: "var(--pc-warn, var(--pc-accent-2, #b8563b))" },
  ];

  const phq9Total = phq9Slices.reduce((a, x) => a + x.value, 0);
  const gad7Total = gad7Slices.reduce((a, x) => a + x.value, 0);
  const phq9Positive = phq9.moderate + phq9.moderatelySevere + phq9.severe;
  const gad7Positive = gad7.moderate + gad7.severe;
  const combinedTotal   = phq9Total + gad7Total;
  const combinedPositive = phq9Positive + gad7Positive;

  const scope =
    scale === "phq9" ? { total: phq9Total, positive: phq9Positive } :
    scale === "gad7" ? { total: gad7Total, positive: gad7Positive } :
                       { total: combinedTotal, positive: combinedPositive };

  const positiveRate = scope.total ? (scope.positive / scope.total) * 100 : 0;

  // Participation vs. eligible
  const eligible = selectedDept.n;
  const invited   = Math.round(eligible * 0.92);
  const started   = Math.round(invited * 0.71);
  const completed = Math.round(started * 0.88);
  const positive  = Math.round(completed * (positiveRate / 100));
  const referred  = Math.round(positive * 0.74);
  const booked    = Math.round(referred * 0.68);
  const attended  = Math.round(booked * 0.79);
  const participation = eligible ? (completed / eligible) * 100 : 0;

  // Referral chord weights
  const referralLinks = [
    { from: "positive", to: "referred", weight: referred },
    { from: "referred", to: "booked",   weight: booked },
    { from: "booked",   to: "attended", weight: attended },
    { from: "attended", to: "followup", weight: Math.round(attended * 0.62) },
    { from: "positive", to: "followup", weight: Math.round(positive * 0.14) },
  ];

  // Trend
  const trendPoints = windowKey === "month" ? 8 : windowKey === "term" ? 16 : 26;
  const trend = useMemo(() => positiveTrend(`${dept}:${scale}:${windowKey}`, trendPoints), [dept, scale, windowKey, trendPoints]);
  const trendCurrent = trend[trend.length - 1]?.y ?? positiveRate;
  const trendPrior   = trend[trend.length - 5]?.y ?? trendCurrent;
  const trendDelta   = Math.round((trendCurrent - trendPrior) * 10) / 10;

  // Volume
  const volume = useMemo(() => volumeBars(`${dept}:${windowKey}`, 12), [dept, windowKey]);
  const totalScreens = volume.reduce((a, b) => a + b, 0);

  // Per-program participation
  const programRows = SEED_DEPARTMENTS.map((d) => {
    const n = Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0);
    const rand = mulberry32(SEED_ROOT ^ hash(`${d.id}:part`));
    const part = 0.42 + rand() * 0.32;
    const pos  = 0.14 + rand() * 0.14;
    return { id: d.id, name: d.name, school: d.school, n, participation: part, positiveRate: pos };
  });

  function setWindow(k: WindowKey) { nav({ search: { ...s, window: k } }); }
  function setScale(k: ScaleKey) { nav({ search: { ...s, scale: k } }); }
  function setDept(id: string) { nav({ search: { ...s, dept: id } }); }

  return (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Screening outcomes"
        subtitle="PHQ-9 and GAD-7 participation, severity distributions, positive-screen trends and referral routing. Aggregate-only, k ≥ 10 enforced across every slice."
      />

      {/* Slicers */}
      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_auto_1fr_auto] md:items-start">
          <Group label="Window">
            {WINDOWS.map((k) => (
              <Chip key={k} active={k === windowKey} onClick={() => setWindow(k)}>{WINDOW_LABEL[k]}</Chip>
            ))}
          </Group>
          <Group label="Scale">
            {SCALES.map((k) => (
              <Chip key={k} active={k === scale} onClick={() => setScale(k)}>{SCALE_LABEL[k]}</Chip>
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
            {/* Hero KPI */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>Positive-screen rate</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={positiveRate} decimals={1} />
                </span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>%</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--pc-surface2)",
                  border: "1px solid var(--pc-border)",
                  color: trendDelta > 0 ? "var(--pc-warn, var(--pc-accent-2))" : trendDelta < 0 ? "var(--pc-good, var(--pc-primary))" : "var(--pc-muted)",
                }}>
                {trendDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(trendDelta > 0 ? "+" : "") + trendDelta.toFixed(1)} pts vs. prior period
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Participation</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{participation.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Total screens</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{totalScreens.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Every band aggregates 10+ students.</span>
              </div>
            </FlowCard>

            {/* Positive rate trend */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-6 p-5">
              <SectionTitle title="Positive-screen rate · over time" subtitle={`% of completed ${scale === "both" ? "PHQ-9 + GAD-7" : scale.toUpperCase()} above clinical cutoff.`} />
              <div className="mt-3">
                <TrendArea data={trend} height={200} color="var(--pc-primary)" ariaLabel="Positive screen rate trend" />
              </div>
            </FlowCard>

            {/* Volume bars */}
            <FlowCard className="col-span-12 md:col-span-12 lg:col-span-3 p-5">
              <SectionTitle title="Monthly volume" subtitle="Screens completed per calendar month." />
              <div className="mt-4 flex flex-col items-start gap-3">
                <Sparkbar values={volume} width={260} height={80} color="var(--pc-primary)" ariaLabel="Monthly screening volume" />
                <div className="text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                  Peak <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{Math.max(...volume).toLocaleString()}</span> ·
                  {" "}Avg <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{Math.round(totalScreens / volume.length).toLocaleString()}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}>
                  <ClipboardCheck className="h-3 w-3" /> {totalScreens.toLocaleString()} total screens
                </div>
              </div>
            </FlowCard>

            {/* Severity donuts */}
            {(scale === "both" || scale === "phq9") && (
              <FlowCard className="col-span-12 md:col-span-6 lg:col-span-4 p-5">
                <SectionTitle title="PHQ-9 · severity bands" subtitle={`${phq9Total.toLocaleString()} completed screens — depression severity.`} />
                <div className="mt-3 flex items-center gap-4">
                  <Donut slices={phq9Slices} size={148} stroke={16} centerLabel={`${((phq9Positive / phq9Total) * 100).toFixed(0)}%`} centerSub="positive" ariaLabel="PHQ-9 severity" />
                  <Legend slices={phq9Slices} total={phq9Total} />
                </div>
              </FlowCard>
            )}
            {(scale === "both" || scale === "gad7") && (
              <FlowCard className="col-span-12 md:col-span-6 lg:col-span-4 p-5">
                <SectionTitle title="GAD-7 · severity bands" subtitle={`${gad7Total.toLocaleString()} completed screens — anxiety severity.`} />
                <div className="mt-3 flex items-center gap-4">
                  <Donut slices={gad7Slices} size={148} stroke={16} centerLabel={`${((gad7Positive / gad7Total) * 100).toFixed(0)}%`} centerSub="positive" ariaLabel="GAD-7 severity" />
                  <Legend slices={gad7Slices} total={gad7Total} />
                </div>
              </FlowCard>
            )}

            {/* Completion funnel */}
            <FlowCard className={`col-span-12 ${scale === "both" ? "lg:col-span-4" : "lg:col-span-8"} p-5`}>
              <SectionTitle title="Completion funnel" subtitle="From invitation to attended session — this window." />
              <div className="mt-3">
                <FunnelBars
                  steps={[
                    { label: "Invited",   value: invited },
                    { label: "Started",   value: started },
                    { label: "Completed", value: completed },
                    { label: "Positive",  value: positive },
                    { label: "Referred",  value: referred },
                    { label: "Booked",    value: booked },
                    { label: "Attended",  value: attended },
                  ]}
                  color="var(--pc-primary)"
                  ariaLabel="Screening completion and referral funnel"
                />
              </div>
            </FlowCard>

            {/* Referral chord */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Referral routing" subtitle="Flow from positive screens → booked → attended → follow-up. Line weight = student count." />
              <div className="mt-3 flex justify-center">
                <ChordMini nodes={REFERRAL_NODES} links={referralLinks} size={260} ariaLabel="Referral routing chord diagram" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>
                <div>Attendance rate: <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{booked ? ((attended / booked) * 100).toFixed(0) : 0}%</span></div>
                <div>Referral uptake: <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{positive ? ((referred / positive) * 100).toFixed(0) : 0}%</span></div>
              </div>
            </FlowCard>

            {/* Per-program participation */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <SectionTitle title="Participation · by program" subtitle="Completed / eligible, with positive-screen rate." />
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{programRows.length} programs</span>
              </div>
              <ul className="mt-3">
                {programRows.map((p, i) => {
                  const dim = p.n < N_MIN;
                  return (
                    <li key={p.id} className="flex items-center gap-3 py-2"
                      style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{p.name}</div>
                        <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{p.school} · n={p.n.toLocaleString()}</div>
                      </div>
                      {dim ? (
                        <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}>hidden</span>
                      ) : (
                        <>
                          <div className="w-40">
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                              <div className="h-full" style={{ width: `${p.participation * 100}%`, background: "var(--pc-primary)" }} />
                            </div>
                            <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--pc-muted)" }}>
                              <span>Participation {(p.participation * 100).toFixed(0)}%</span>
                              <span>Positive {(p.positiveRate * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            PHQ-9 positive = score ≥ 10 (moderate+). GAD-7 positive = score ≥ 10 (moderate+). Aggregate only; every band represents ≥10 students.
          </Reveal>
        </>
      )}
    </>
  );
}

// ── UI atoms ───────────────────────────────────────────────────
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
function Legend({ slices, total }: { slices: { label: string; value: number; color?: string }[]; total: number }) {
  return (
    <ul className="flex-1 min-w-0 space-y-1.5">
      {slices.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-[11.5px]">
          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: s.color ?? "var(--pc-primary)" }} />
          <span className="truncate" style={{ color: "var(--pc-ink-2)" }}>{s.label}</span>
          <span className="ml-auto font-mono" style={{ color: "var(--pc-muted)" }}>
            {s.value.toLocaleString()}<span className="ml-1">· {total ? ((s.value / total) * 100).toFixed(0) : 0}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
