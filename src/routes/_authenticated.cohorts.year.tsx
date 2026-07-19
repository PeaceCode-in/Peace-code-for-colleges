import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { ArrowRight, Copy, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Heatmap } from "@/components/viz/Heatmap";
import { RidgeChart } from "@/components/viz/RidgeChart";
import { FunnelBars } from "@/components/viz/FunnelBars";
import { RadarSmall } from "@/components/viz/RadarSmall";
import { VizSparkline } from "@/components/viz/Sparkline";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, SEED_YEARS, cohortMatrix } from "@/lib/data/seed";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ─── URL state ──────────────────────────────────────────────────
const INTAKES = ["aug-2025", "jan-2026", "aug-2026"] as const;
const INTAKE_LABEL: Record<(typeof INTAKES)[number], string> = {
  "aug-2025": "Aug 2025",
  "jan-2026": "Jan 2026",
  "aug-2026": "Aug 2026",
};

const search = z.object({
  years:    fallback(z.array(z.string()), []).default([]),
  programs: fallback(z.array(z.string()), []).default([]),
  intake:   fallback(z.string(), "aug-2025").default("aug-2025"),
});

export const Route = createFileRoute("/_authenticated/cohorts/year")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Year & program — PeaceCode for Colleges" },
      { name: "description", content: "Wellbeing patterns sliced by year of study and program, aggregate-only with k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: YearProgramPage,
});

// ─── Deterministic derived signals (per dept, per year) ─────────
function wellbeingFor(deptId: string, yr: string): number {
  const seed = SEED_ROOT ^ hash(`${deptId}:${yr}:wb`);
  const rand = mulberry32(seed);
  return Math.round((60 + rand() * 22) * 10) / 10; // 60-82
}
function engagementFor(deptId: string): number {
  const seed = SEED_ROOT ^ hash(`${deptId}:eng`);
  const rand = mulberry32(seed);
  return Math.round((0.42 + rand() * 0.32) * 100) / 100;
}
function highRiskFor(deptId: string): number {
  const seed = SEED_ROOT ^ hash(`${deptId}:hr`);
  const rand = mulberry32(seed);
  return Math.round((0.04 + rand() * 0.09) * 100) / 100;
}
function retentionFor(deptId: string): number {
  const seed = SEED_ROOT ^ hash(`${deptId}:ret`);
  const rand = mulberry32(seed);
  return Math.round((0.72 + rand() * 0.22) * 100) / 100;
}
function programSparkline(deptId: string): number[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${deptId}:spark`));
  const out: number[] = [];
  let v = 62 + rand() * 12;
  for (let i = 0; i < 14; i++) {
    v += (rand() - 0.5) * 2.2;
    v = Math.max(50, Math.min(88, v));
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}
function topSignals(deptId: string): Array<{ label: string; delta: string; tone: "up" | "down" | "flat" }> {
  const rand = mulberry32(SEED_ROOT ^ hash(`${deptId}:sig`));
  const pool: Array<{ label: string; delta: string; tone: "up" | "down" | "flat" }> = [
    { label: "Session completion", delta: `${rand() > 0.5 ? "+" : "-"}${(rand() * 8 + 2).toFixed(1)}%`, tone: rand() > 0.5 ? "up" : "down" },
    { label: "PHQ-9 moderate band", delta: `${rand() > 0.6 ? "-" : "+"}${(rand() * 6 + 1).toFixed(1)}%`, tone: rand() > 0.6 ? "down" : "up" },
    { label: "Peer-bridge uptake",   delta: `+${(rand() * 12 + 3).toFixed(0)}%`,                        tone: "up" },
    { label: "GAD-7 severe band",    delta: `+${(rand() * 4 + 0.5).toFixed(1)}%`,                       tone: "up" },
    { label: "Screening completion", delta: `${(rand() * 5 - 1).toFixed(1)}%`,                          tone: "flat" },
  ];
  return pool.slice(0, 3);
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ─── Component ──────────────────────────────────────────────────
function YearProgramPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/cohorts/year" });
  const [hoverDept, setHoverDept] = useState<string | null>(null);

  const selectedYears = s.years.length ? s.years : (SEED_YEARS as readonly string[]);
  const selectedPrograms = s.programs.length ? s.programs : SEED_DEPARTMENTS.map((d) => d.id);
  const intake = (INTAKES as readonly string[]).includes(s.intake) ? s.intake : "aug-2025";

  const matrix = useMemo(() => cohortMatrix(), []);

  // Population under current slicer
  const population = useMemo(() => {
    let sum = 0;
    for (const d of selectedPrograms) {
      const row = matrix[d];
      if (!row) continue;
      for (const y of selectedYears) sum += row[y] ?? 0;
    }
    return sum;
  }, [matrix, selectedPrograms, selectedYears]);

  // Year × Program wellbeing heatmap (rows=years, cols=programs). Suppress cells with cohort<10.
  const heatData = useMemo(() => {
    return selectedYears.map((yr) =>
      selectedPrograms.map((deptId) => {
        const n = matrix[deptId]?.[yr] ?? 0;
        if (n < N_MIN) return { value: null };
        return { value: wellbeingFor(deptId, yr), label: `${SEED_DEPARTMENTS.find((d) => d.id === deptId)?.name} · ${yr}: ${wellbeingFor(deptId, yr)}` };
      }),
    );
  }, [matrix, selectedPrograms, selectedYears]);

  // Radar: up to 4 selected programs across 6 axes
  const radarPrograms = selectedPrograms.slice(0, 4);
  const RADAR_AXES = ["Wellbeing", "Engagement", "Retention", "Screening", "Peer bridge", "Care uptake"];
  const RADAR_COLORS = [
    "var(--pc-accent, var(--pc-primary))",
    "var(--pc-primary)",
    "var(--pc-good, var(--pc-primary))",
    "var(--pc-warn, var(--pc-accent-2))",
  ];
  const radarSeries = radarPrograms.map((deptId, i) => {
    const rand = mulberry32(SEED_ROOT ^ hash(`${deptId}:radar`));
    return {
      label: SEED_DEPARTMENTS.find((d) => d.id === deptId)?.name ?? deptId,
      color: RADAR_COLORS[i % RADAR_COLORS.length]!,
      values: [
        wellbeingFor(deptId, "Y2"),
        engagementFor(deptId) * 100,
        retentionFor(deptId) * 100,
        60 + rand() * 30,
        45 + rand() * 40,
        50 + rand() * 35,
      ],
    };
  });

  // Ridge chart YoY — one row per selected year, density curve (mock)
  const ridgeSeries = selectedYears.map((yr) => ({
    label: yr,
    values: densityCurve(yr),
  }));

  // Retention funnel across selection
  const totalEnrolled = population;
  const totalActive = Math.round(totalEnrolled * 0.86);
  const totalAtRisk = Math.round(totalEnrolled * 0.11);
  const totalRecovered = Math.round(totalAtRisk * 0.63);
  const funnelSteps = [
    { label: "Enrolled",  value: totalEnrolled },
    { label: "Active",    value: totalActive },
    { label: "At-risk",   value: totalAtRisk },
    { label: "Recovered", value: totalRecovered },
  ];

  const hasSlice = selectedPrograms.length > 0 && selectedYears.length > 0;

  // ─── Slicer handlers ─────────────────────────────────────────
  function toggleYear(yr: string) {
    const set = new Set(s.years);
    set.has(yr) ? set.delete(yr) : set.add(yr);
    nav({ search: { ...s, years: [...set] } });
  }
  function toggleProgram(id: string) {
    const set = new Set(s.programs);
    set.has(id) ? set.delete(id) : set.add(id);
    nav({ search: { ...s, programs: [...set] } });
  }
  function reset() {
    nav({ search: { years: [], programs: [], intake: "aug-2025" } });
  }
  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success("Link copied"),
      () => toast.error("Copy failed"),
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Cohort insights"
        title="Year & program"
        subtitle="Wellbeing patterns sliced by year of study and academic program. Every cell is aggregate-only and enforces k ≥ 10 — smaller cohorts render as hatched."
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyLink} className="text-[12px] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2"
              style={{ border: "1px solid var(--pc-border)", background: "var(--pc-surface)", color: "var(--pc-ink-2)" }}>
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
            <button type="button" onClick={reset} className="text-[12px] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2"
              style={{ border: "1px solid var(--pc-border)", background: "var(--pc-surface)", color: "var(--pc-ink-2)" }}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        }
      />

      {/* ─── Slicer bar ─── */}
      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
          <ChipRow
            label="Year of study"
            options={SEED_YEARS.map((y) => ({ value: y, label: y }))}
            selected={new Set(s.years)}
            onToggle={toggleYear}
            emptyLabel="All years"
          />
          <ChipRow
            label="Program"
            options={SEED_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
            selected={new Set(s.programs)}
            onToggle={toggleProgram}
            emptyLabel="All programs"
          />
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
              Intake term
            </div>
            <div className="flex gap-1.5">
              {INTAKES.map((k) => {
                const active = k === intake;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => nav({ search: { ...s, intake: k } })}
                    className="text-[12px] px-2.5 py-1 rounded-full transition-colors"
                    style={{
                      background: active ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface2))" : "var(--pc-surface)",
                      color: active ? "var(--pc-accent, var(--pc-primary))" : "var(--pc-ink-2)",
                      border: active ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "1px solid var(--pc-border)",
                    }}
                  >
                    {INTAKE_LABEL[k]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {!hasSlice ? (
        <GlassCard className="p-10">
          <EmptyState kind="filtered" title="Pick at least one year and one program" subtitle="Or clear filters to see the whole institution." />
        </GlassCard>
      ) : (
        <>
          {/* ─── Bento ─── */}
          <StaggerGrid className="grid grid-cols-12 gap-4">
            {/* Population */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>Cohort population</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={population} />
                </span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>students</span>
              </div>
              <div className="mt-4 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                {selectedPrograms.length} program{selectedPrograms.length === 1 ? "" : "s"} · {selectedYears.length} year{selectedYears.length === 1 ? "" : "s"} · Intake {INTAKE_LABEL[intake as (typeof INTAKES)[number]]}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span aria-label="k-anonymity threshold" className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Smaller cohorts hatched.</span>
              </div>
            </FlowCard>

            {/* Year × Wellbeing heatmap */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-6 p-5">
              <SectionTitle title="Year × program wellbeing" subtitle="Wellbeing index (0–100). Hover a cell for the exact value." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap
                  rows={selectedYears as string[]}
                  cols={selectedPrograms.map((id) => SEED_DEPARTMENTS.find((d) => d.id === id)?.name.slice(0, 4) ?? id)}
                  data={heatData}
                  ariaLabel="Wellbeing heatmap of year × program"
                  min={55}
                  max={85}
                  cellSize={30}
                />
              </div>
            </FlowCard>

            {/* Radar — program comparison */}
            <FlowCard className="col-span-12 lg:col-span-3 p-5">
              <SectionTitle title="Program comparison" subtitle={`Top ${radarPrograms.length} selected program${radarPrograms.length === 1 ? "" : "s"} across 6 dimensions.`} />
              <div className="mt-2 flex justify-center">
                <RadarSmall axes={RADAR_AXES} series={radarSeries} size={220} max={100} />
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {radarSeries.map((s2) => (
                  <li key={s2.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--pc-ink-2)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: s2.color }} />
                    {s2.label}
                  </li>
                ))}
              </ul>
            </FlowCard>

            {/* YoY Ridge */}
            <FlowCard className="col-span-12 md:col-span-7 p-5">
              <SectionTitle title="Year-over-year distribution" subtitle="Wellbeing density curves per selected year." />
              <div className="mt-3 flex justify-center overflow-x-auto">
                <RidgeChart series={ridgeSeries} width={520} height={Math.max(120, ridgeSeries.length * 44)} color="var(--pc-accent, var(--pc-primary))" ariaLabel="Year-over-year wellbeing distribution" />
              </div>
            </FlowCard>

            {/* Retention funnel */}
            <FlowCard className="col-span-12 md:col-span-5 p-5">
              <SectionTitle title="Retention funnel" subtitle="Enrolled → Active → At-risk → Recovered for the current slice." />
              <div className="mt-3">
                <FunnelBars steps={funnelSteps} color="var(--pc-primary)" ariaLabel="Retention funnel" />
              </div>
            </FlowCard>

            {/* Program list w/ hover-detail drawer */}
            <FlowCard className="col-span-12 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <SectionTitle title="Programs in this slice" subtitle="Hover a program to see its 14-week wellbeing trend and top 3 signals." />
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{selectedPrograms.length} programs</span>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
                <ul>
                  {selectedPrograms.map((deptId, i) => {
                    const dept = SEED_DEPARTMENTS.find((d) => d.id === deptId);
                    if (!dept) return null;
                    const n = selectedYears.reduce((sum, y) => sum + (matrix[deptId]?.[y] ?? 0), 0);
                    const wb = wellbeingFor(deptId, "Y2");
                    const eng = Math.round(engagementFor(deptId) * 100);
                    const hr = Math.round(highRiskFor(deptId) * 100);
                    const suppressed = n < N_MIN;
                    return (
                      <li
                        key={deptId}
                        onMouseEnter={() => setHoverDept(deptId)}
                        onFocus={() => setHoverDept(deptId)}
                        tabIndex={0}
                        className="flex items-center gap-3 py-2.5 cursor-default focus-visible:outline-none focus-visible:bg-[color:var(--pc-surface2)] rounded-md px-2 -mx-2"
                        style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{dept.name}</div>
                          <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{dept.school} · n={n.toLocaleString()}</div>
                        </div>
                        <div className="hidden sm:block">
                          {suppressed
                            ? <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}>hidden · k&lt;10</span>
                            : <VizSparkline values={programSparkline(deptId)} width={120} height={22} color="var(--pc-accent, var(--pc-primary))" ariaLabel={`${dept.name} 14-week trend`} />}
                        </div>
                        <div className="w-16 text-right text-[12px] font-mono" style={{ color: suppressed ? "var(--pc-muted)" : "var(--pc-ink-2)" }}>
                          {suppressed ? "—" : wb.toFixed(1)}
                        </div>
                        <div className="hidden md:block w-14 text-right text-[11px] font-mono" style={{ color: "var(--pc-muted)" }}>
                          {suppressed ? "—" : `${eng}%`}
                        </div>
                        <div className="hidden md:block w-14 text-right text-[11px] font-mono" style={{ color: suppressed ? "var(--pc-muted)" : "var(--pc-warn, var(--pc-accent-2))" }}>
                          {suppressed ? "—" : `${hr}%`}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <ProgramDrawer deptId={hoverDept ?? selectedPrograms[0] ?? null} onClear={() => setHoverDept(null)} />
              </div>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            Aggregate only. No student is ever identifiable. k=10 enforced across every slice, every export.
          </Reveal>
        </>
      )}
    </>
  );
}

// ─── Local pieces ───────────────────────────────────────────────
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

function ChipRow({
  label,
  options,
  selected,
  onToggle,
  emptyLabel,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: Set<string>;
  onToggle: (v: string) => void;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
          {label}
        </div>
        <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
          {selected.size === 0 ? emptyLabel : `${selected.size} selected`}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.has(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onToggle(o.value)}
              aria-pressed={active}
              className="text-[12px] px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1"
              style={{
                background: active ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface2))" : "var(--pc-surface)",
                color: active ? "var(--pc-accent, var(--pc-primary))" : "var(--pc-ink-2)",
                border: active ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "1px solid var(--pc-border)",
              }}
            >
              {o.label}
              {active && <X className="h-3 w-3 opacity-70" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramDrawer({ deptId, onClear }: { deptId: string | null; onClear: () => void }) {
  const dept = deptId ? SEED_DEPARTMENTS.find((d) => d.id === deptId) : null;
  if (!dept || !deptId) {
    return (
      <div className="rounded-xl p-4 text-[12px]" style={{ background: "var(--pc-surface2)", border: "1px dashed var(--pc-border)", color: "var(--pc-muted)" }}>
        Hover a program to see details.
      </div>
    );
  }
  const spark = programSparkline(deptId);
  const wb = wellbeingFor(deptId, "Y2");
  const sigs = topSignals(deptId);
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>Program detail</div>
          <div className="font-serif text-[15px] truncate" style={{ color: "var(--pc-ink)" }}>{dept.name}</div>
          <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{dept.school}</div>
        </div>
        <button type="button" onClick={onClear} className="p-1 rounded-md" aria-label="Clear hover" style={{ color: "var(--pc-muted)" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>Wellbeing index</div>
          <div className="font-serif text-[26px]" style={{ color: "var(--pc-ink)" }}><CountUp value={wb} decimals={1} /></div>
        </div>
        <VizSparkline values={spark} width={140} height={40} color="var(--pc-accent, var(--pc-primary))" ariaLabel={`${dept.name} 14-week wellbeing`} />
      </div>
      <div className="mt-3">
        <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>Top signals</div>
        <ul className="mt-1.5 space-y-1">
          {sigs.map((s) => (
            <li key={s.label} className="flex items-center justify-between text-[12px]" style={{ color: "var(--pc-ink-2)" }}>
              <span>{s.label}</span>
              <span
                className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                style={{
                  color: s.tone === "up" ? "var(--pc-warn, var(--pc-accent-2))" : s.tone === "down" ? "var(--pc-good, var(--pc-primary))" : "var(--pc-muted)",
                  background: "var(--pc-surface)",
                  border: "1px solid var(--pc-border)",
                }}
              >
                {s.delta}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <a href="/departments" className="mt-3 text-[11.5px] inline-flex items-center gap-1 hover:underline" style={{ color: "var(--pc-accent, var(--pc-primary))" }}>
        Open in Departments <ArrowRight className="h-3 w-3" />
      </a>
    </div>
  );
}

// Density curve for a given year (deterministic mock).
function densityCurve(yr: string): number[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${yr}:density`));
  const n = 40;
  const mean = 20 + rand() * 8;
  const sd = 6 + rand() * 3;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = Math.exp(-((x - mean) ** 2) / (2 * sd * sd));
    out.push(y);
  }
  return out;
}
