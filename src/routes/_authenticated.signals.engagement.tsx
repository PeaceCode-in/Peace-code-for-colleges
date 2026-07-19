import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Heatmap } from "@/components/viz/Heatmap";
import { TrendArea } from "@/components/viz/TrendArea";
import { FunnelBars } from "@/components/viz/FunnelBars";
import { Donut } from "@/components/viz/Donut";
import { Sparkbar } from "@/components/viz/Sparkbar";
import { RadialProgress } from "@/components/viz/RadialProgress";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, cohortMatrix } from "@/lib/data/seed";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ── URL state ───────────────────────────────────────────────────
const WINDOWS = ["30d", "90d", "term"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_LABEL: Record<WindowKey, string> = { "30d": "30 days", "90d": "90 days", term: "Term" };
const WINDOW_DAYS: Record<WindowKey, number> = { "30d": 30, "90d": 90, term: 120 };

const search = z.object({
  window: fallback(z.string(), "90d").default("90d"),
  dept:   fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/signals/engagement")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Engagement rhythm — PeaceCode for Colleges" },
      { name: "description", content: "Weekly engagement rhythm across check-ins, journal, breathing and PeaceBot. Aggregate-only, k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EngagementPage,
});

// ── Helpers ─────────────────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const FEATURES = [
  { id: "checkin",   label: "Check-ins",  color: "var(--pc-primary)" },
  { id: "journal",   label: "Journal",    color: "color-mix(in oklab, var(--pc-primary) 65%, var(--pc-accent-2, #b8563b) 20%)" },
  { id: "breathing", label: "Breathing",  color: "color-mix(in oklab, var(--pc-primary) 45%, var(--pc-surface2))" },
  { id: "peacebot",  label: "PeaceBot",   color: "color-mix(in oklab, var(--pc-accent-2, #b8563b) 60%, var(--pc-primary))" },
  { id: "sessions",  label: "Sessions",   color: "var(--pc-accent-2, #b8563b)" },
] as const;

function weeklyActivity(key: string, points: number): { x: string; y: number }[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:wa`));
  const out: { x: string; y: number }[] = [];
  const today = new Date();
  let base = 0.52 + rand() * 0.1;
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const drift = Math.sin(i / 3) * 0.06 + (rand() - 0.5) * 0.04;
    const midterm = i === Math.floor(points / 2) ? -0.08 : 0;
    const v = Math.max(0.28, Math.min(0.82, base + drift + midterm));
    base += (rand() - 0.5) * 0.02;
    out.push({ x: d.toISOString().slice(5, 10), y: Math.round(v * 1000) / 10 });
  }
  return out;
}

function dayHourRhythm(key: string) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:rhythm`));
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cols = Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? String(i) : ""));
  const data = rows.map((_, ri) =>
    Array.from({ length: 24 }, (_, ci) => {
      const morning = ci >= 8 && ci <= 10 ? 0.35 : 0;
      const evening = ci >= 20 && ci <= 23 ? 0.55 : 0;
      const lateNight = ci >= 0 && ci <= 2 ? 0.18 : 0;
      const weekend = (ri === 5 || ri === 6) && (ci >= 11 && ci <= 15) ? 0.28 : 0;
      const noise = rand() * 0.14;
      const v = Math.min(1, morning + evening + lateNight + weekend + noise);
      return { value: Math.round(v * 100) / 100, label: `${rows[ri]} ${String(ci).padStart(2, "0")}:00 — activity ${(v * 100).toFixed(0)}%` };
    }),
  );
  return { rows, cols, data };
}

function featureStreak(key: string): number[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:streak`));
  return Array.from({ length: 14 }, () => 2 + Math.round(rand() * 8));
}

function EngagementPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/signals/engagement" });
  const windowKey: WindowKey = (WINDOWS as readonly string[]).includes(s.window) ? (s.window as WindowKey) : "90d";
  const dept = s.dept;

  const matrix = useMemo(() => cohortMatrix(), []);
  const deptOptions = [
    { id: "all", name: "All institution", n: Object.values(matrix).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0) },
    ...SEED_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, n: Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0) })),
  ];
  const selectedDept = deptOptions.find((d) => d.id === dept) ?? deptOptions[0]!;
  const suppressed = selectedDept.n < N_MIN;

  const days = WINDOW_DAYS[windowKey];
  const weeks = Math.max(6, Math.floor(days / 7));

  const wau = useMemo(() => weeklyActivity(`${dept}:${windowKey}`, weeks), [dept, windowKey, weeks]);
  const currentWau = wau[wau.length - 1]?.y ?? 0;
  const priorWau   = wau[wau.length - 5]?.y ?? currentWau;
  const wauDelta   = Math.round((currentWau - priorWau) * 10) / 10;

  const heat = useMemo(() => dayHourRhythm(`${dept}:${windowKey}`), [dept, windowKey]);

  // Feature funnel (weekly-active students → each feature)
  const eligible = selectedDept.n;
  const wauCount = Math.round(eligible * (currentWau / 100));
  const funnel = [
    { label: "Signed in",   value: wauCount },
    { label: "Checked in",  value: Math.round(wauCount * 0.86) },
    { label: "Journaled",   value: Math.round(wauCount * 0.54) },
    { label: "Breathing",   value: Math.round(wauCount * 0.38) },
    { label: "PeaceBot",    value: Math.round(wauCount * 0.29) },
    { label: "Session",     value: Math.round(wauCount * 0.11) },
  ];

  // Feature mix (donut)
  const featureRand = mulberry32(SEED_ROOT ^ hash(`${dept}:mix`));
  const rawMix = FEATURES.map((f) => 40 + Math.floor(featureRand() * 120));
  const mixSlices = FEATURES.map((f, i) => ({ label: f.label, value: rawMix[i]!, color: f.color }));
  const mixTotal = rawMix.reduce((a, b) => a + b, 0);

  // Retention curve (day 1, 3, 7, 14, 21, 30)
  const retRand = mulberry32(SEED_ROOT ^ hash(`${dept}:ret`));
  const retention = [1, 3, 7, 14, 21, 30].map((d) => {
    const decay = Math.pow(0.88, Math.log2(d + 1));
    const jitter = (retRand() - 0.5) * 0.05;
    return { x: `D${d}`, y: Math.round(Math.max(0.18, Math.min(1, decay + jitter)) * 1000) / 10 };
  });

  // Feature streaks
  const featureStreaks = FEATURES.map((f) => ({
    ...f,
    bars: featureStreak(`${dept}:${f.id}`),
  }));

  // Median session length
  const medRand = mulberry32(SEED_ROOT ^ hash(`${dept}:median`));
  const medianMin = Math.round((4.2 + medRand() * 3.4) * 10) / 10;
  const activationPct = Math.round(38 + medRand() * 22);

  function setWindow(k: WindowKey) { nav({ search: { ...s, window: k } }); }
  function setDept(id: string) { nav({ search: { ...s, dept: id } }); }

  return (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Engagement rhythm"
        subtitle="How the cohort engages with the Companion week over week — check-ins, journal, breathing, PeaceBot and sessions. Aggregate-only, k ≥ 10 enforced."
      />

      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
          <Group label="Window">
            {WINDOWS.map((k) => (
              <Chip key={k} active={k === windowKey} onClick={() => setWindow(k)}>{WINDOW_LABEL[k]}</Chip>
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
            {/* WAU hero */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>Weekly active</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={currentWau} decimals={1} />
                </span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>% of cohort</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--pc-surface2)",
                  border: "1px solid var(--pc-border)",
                  color: wauDelta > 0 ? "var(--pc-good, var(--pc-primary))" : wauDelta < 0 ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-muted)",
                }}>
                {wauDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(wauDelta > 0 ? "+" : "") + wauDelta.toFixed(1)} pts vs. 4 wks ago
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Median session</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{medianMin} min</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Activated</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{activationPct}%</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Every band aggregates 10+ students.</span>
              </div>
            </FlowCard>

            {/* WAU trend */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-6 p-5">
              <SectionTitle title="Weekly active students · over time" subtitle="Share of the cohort that opened Companion in a given week." />
              <div className="mt-3">
                <TrendArea data={wau} height={200} color="var(--pc-primary)" ariaLabel="Weekly active students trend" yDomain={[0, 100]} />
              </div>
            </FlowCard>

            {/* Retention */}
            <FlowCard className="col-span-12 md:col-span-12 lg:col-span-3 p-5">
              <SectionTitle title="Retention curve" subtitle="Share of newly-onboarded students still active after N days." />
              <div className="mt-3">
                <TrendArea data={retention} height={160} color="var(--pc-accent-2, var(--pc-primary))" ariaLabel="Retention curve" yDomain={[0, 100]} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>
                <RadialProgress value={retention[retention.length - 1]?.y ?? 0} max={100} size={48} strokeWidth={5} label={`${retention[retention.length - 1]?.y ?? 0}%`} ariaLabel="Day-30 retention" />
                <span>Day-30 retention</span>
              </div>
            </FlowCard>

            {/* Day × hour rhythm */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <SectionTitle title="When students engage" subtitle="Day of week × hour. Darker = more activity across all features." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap rows={heat.rows} cols={heat.cols} data={heat.data} min={0} max={1} cellSize={22} ariaLabel="Engagement rhythm heatmap" />
              </div>
              <div className="mt-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>
                Peak windows cluster around <span style={{ color: "var(--pc-ink-2)" }}>8-10am</span> and <span style={{ color: "var(--pc-ink-2)" }}>8-11pm</span>, with weekend late-mornings following behind.
              </div>
            </FlowCard>

            {/* Feature mix */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Feature mix" subtitle="Share of interactions across Companion surfaces this window." />
              <div className="mt-3 flex items-center gap-4">
                <Donut slices={mixSlices} size={148} stroke={16} centerLabel={`${mixTotal.toLocaleString()}`} centerSub="events" ariaLabel="Feature mix donut" />
                <ul className="flex-1 min-w-0 space-y-1.5">
                  {mixSlices.map((sl) => (
                    <li key={sl.label} className="flex items-center gap-2 text-[11.5px]">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: sl.color }} />
                      <span className="truncate" style={{ color: "var(--pc-ink-2)" }}>{sl.label}</span>
                      <span className="ml-auto font-mono" style={{ color: "var(--pc-muted)" }}>
                        {mixTotal ? ((sl.value / mixTotal) * 100).toFixed(0) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FlowCard>

            {/* Weekly feature funnel */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Feature funnel · this week" subtitle="How weekly-active students propagate across Companion surfaces." />
              <div className="mt-3">
                <FunnelBars steps={funnel} color="var(--pc-primary)" ariaLabel="Feature engagement funnel" />
              </div>
            </FlowCard>

            {/* Feature streaks */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <SectionTitle title="Feature streaks · last 14 days" subtitle="Daily volume per surface. Longer bars = heavier days." />
                <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "var(--pc-muted)" }}>
                  <Activity className="h-3 w-3" /> {FEATURES.length} surfaces
                </span>
              </div>
              <ul className="mt-3">
                {featureStreaks.map((f, i) => {
                  const total = f.bars.reduce((a, b) => a + b, 0);
                  return (
                    <li key={f.id} className="flex items-center gap-3 py-2"
                      style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}>
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: f.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{f.label}</div>
                        <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{total.toLocaleString()} events · 14 days</div>
                      </div>
                      <Sparkbar values={f.bars} width={160} height={22} color={f.color} ariaLabel={`${f.label} last 14 days`} />
                      <span className="w-16 text-right text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>
                        {Math.max(...f.bars)}<span className="text-[10px]" style={{ color: "var(--pc-muted)" }}> peak</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            Aggregate only. All rhythms describe patterns across ≥10 students — no individual events are shown.
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
