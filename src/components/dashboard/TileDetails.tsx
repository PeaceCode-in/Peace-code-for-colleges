// One-file registry of drill-down panels for the executive dashboard.
// Every panel reads getExecutiveDetails() and composes existing viz
// primitives (Sparkline, Sparkbar, TrendArea, Donut, RadialProgress,
// FunnelBars) plus the DetailStat + DetailSection helpers so the sheet
// stays visually consistent across all ten tiles.
//
// Each panel receives the ExecutiveSnapshot so it can render the same
// headline numbers as the tile — the sheet is a superset, not a
// replacement.
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { isSuppressed } from "@/lib/anonymity";
import type { ExecutiveSnapshot } from "@/lib/dashboard-mock";
import { getExecutiveDetails } from "@/lib/dashboard-details";
import { DetailStat, DetailSection } from "./TileDetailSheet";
import { KpiNumber } from "./KpiNumber";
import { DeltaChip } from "./DeltaChip";
import { Sparkline } from "./Sparkline";
import { Sparkbar } from "@/components/viz/Sparkbar";
import { TrendArea } from "@/components/viz/TrendArea";
import { Donut } from "@/components/viz/Donut";
import { RadialProgress } from "@/components/viz/RadialProgress";
import { FunnelBars } from "@/components/viz/FunnelBars";

export type TileKey =
  | "pulse"
  | "active"
  | "crisis"
  | "sessions"
  | "mood"
  | "departments"
  | "trend"
  | "funnel"
  | "concerns"
  | "heatmap";

export const TILE_META: Record<TileKey, { title: string; eyebrow: string; footer: string }> = {
  pulse: {
    title: "Institutional wellness pulse",
    eyebrow: "Composite index · 26-week context",
    footer:
      "Composite blends PHQ-9 improvement (35%), engagement recency (25%), self-report mood (20%), peer connection (10%) and inverse crisis flags (10%). Aggregate only, cohorts n ≥ 5.",
  },
  active: {
    title: "Active students",
    eyebrow: "Weekly engagement · 30-day context",
    footer: "Counts a student as active on any day with a check-in, session, or module event.",
  },
  crisis: {
    title: "Crisis signals",
    eyebrow: "Early-warning severity · 12-week trend",
    footer: "Aggregate counts only — no individual crisis records surface here.",
  },
  sessions: {
    title: "Sessions this week",
    eyebrow: "Delivery mix · 30-day context",
    footer: "Utilisation = booked / offered slots across all counsellors.",
  },
  mood: {
    title: "Average mood",
    eyebrow: "Self-report distribution · 12-week trend",
    footer: "Bucketed 1–10 self-reports. Contributors from a stepwise regression, aggregate only.",
  },
  departments: {
    title: "Departments",
    eyebrow: "Participation, wellness & flags",
    footer: "Click a department name to open its deep-dive.",
  },
  trend: {
    title: "Wellness trend",
    eyebrow: "26-week extended view",
    footer: "Peer benchmark blends 14 anonymised institutions of comparable size.",
  },
  funnel: {
    title: "Risk funnel",
    eyebrow: "Stage conversion & benchmark",
    footer: "Benchmarks are weekly medians across the peer cohort. Aggregate only.",
  },
  concerns: {
    title: "Top concerns",
    eyebrow: "Anonymised tags · per-tag context",
    footer: "Tags come from a fixed enum — no free-text ever leaves the pipeline.",
  },
  heatmap: {
    title: "Engagement heatmap",
    eyebrow: "Day × 2-hour bucket · aggregates",
    footer: "Weekend definition: Saturday–Sunday. All cohorts above the anonymity floor.",
  },
};

export function TileDetailPanel({ tileKey, snap }: { tileKey: TileKey; snap: ExecutiveSnapshot }) {
  const d = getExecutiveDetails(snap);
  switch (tileKey) {
    case "pulse":       return <PulsePanel snap={snap} d={d.pulse} />;
    case "active":      return <ActivePanel snap={snap} d={d.active} />;
    case "crisis":      return <CrisisPanel snap={snap} d={d.crisis} />;
    case "sessions":    return <SessionsPanel snap={snap} d={d.sessions} />;
    case "mood":        return <MoodPanel snap={snap} d={d.mood} />;
    case "departments": return <DepartmentsPanel d={d.departments} />;
    case "trend":       return <TrendPanel d={d.trend} />;
    case "funnel":      return <FunnelPanel d={d.funnel} />;
    case "concerns":    return <ConcernsPanel d={d.concerns} />;
    case "heatmap":     return <HeatmapPanel d={d.heatmap} />;
  }
}

// ─── Panels ────────────────────────────────────────────────────────

function PulsePanel({ snap, d }: any) {
  const w = snap.wellnessIndex;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="Current" value={`${w.current}`} hint={`Δ ${w.deltaVsLastWeek >= 0 ? "+" : ""}${w.deltaVsLastWeek} vs prior wk`} />
        <DetailStat label="26-week peak" value={Math.max(...d.sparkline26w)} />
        <DetailStat label="26-week low" value={Math.min(...d.sparkline26w)} />
        <DetailStat label="Check-ins / wk" value={w.checkInsThisWeek.toLocaleString()} />
      </div>
      <DetailSection title="Last 26 weeks" subtitle="Extended context beyond the tile sparkline.">
        <div className="rounded-lg p-3" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
          <Sparkline values={d.sparkline26w} width={640} height={90} ariaLabel="Wellness pulse over 26 weeks" />
        </div>
      </DetailSection>
      <DetailSection title="Cohort breakdown" subtitle="Composite score by academic year.">
        <ul className="divide-y" style={{ borderColor: "var(--pc-border)" }}>
          {d.cohorts.map((c: any) => (
            <li key={c.key} className="py-2 flex items-center justify-between gap-3">
              <span className="text-[12.5px]" style={{ color: "var(--pc-ink-2)" }}>{c.label}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-[13px]" style={{ color: "var(--pc-ink)" }}>{c.current}</span>
                <DeltaChip delta={c.delta} unit=" pts" />
              </div>
            </li>
          ))}
        </ul>
      </DetailSection>
      <DetailSection title="Contributing drivers" subtitle="Weighted influence on this week's change.">
        <ul className="space-y-2">
          {d.drivers.map((dr: any) => (
            <li key={dr.label} className="rounded-md p-2.5" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--pc-ink)" }}>
                  {dr.direction === "up"
                    ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--pc-good)" }} />
                    : <ArrowDownRight className="w-3.5 h-3.5" style={{ color: "var(--pc-warn)" }} />}
                  {dr.label}
                </span>
                <span className="text-[11px] tabular-nums" style={{ color: "var(--pc-muted)" }}>{dr.weightPct}%</span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--pc-muted)" }}>{dr.note}</div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface)" }}>
                <div style={{ width: `${dr.weightPct}%`, height: "100%", background: "var(--pc-accent)" }} />
              </div>
            </li>
          ))}
        </ul>
      </DetailSection>
      <MethodologyNote text={d.methodology} />
    </>
  );
}

function ActivePanel({ snap, d }: any) {
  const pct = Math.round((snap.activeStudents.n / snap.activeStudents.ofTotal) * 100);
  const trendData = d.daily30.map((p: any) => ({ x: p.day, y: p.n }));
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="Active" value={snap.activeStudents.n.toLocaleString()} hint={`${pct}% of enrolled`} />
        <DetailStat label="New this wk" value={d.cohortMovement.newThisWeek.toLocaleString()} />
        <DetailStat label="Returning" value={d.cohortMovement.returning.toLocaleString()} />
        <DetailStat label="Churned" value={d.cohortMovement.churned.toLocaleString()} hint="No activity in 14d" />
      </div>
      <DetailSection title="Daily active users · last 30 days" subtitle="Sunday drops are expected.">
        <TrendArea data={trendData} ariaLabel="Daily active users over 30 days" seriesLabel="Active" height={180} />
      </DetailSection>
      <DetailSection title="Activation by school">
        <ul className="space-y-2">
          {d.activationBySchool.map((row: any) => (
            <li key={row.school}>
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: "var(--pc-ink-2)" }}>{row.school}</span>
                <span style={{ color: "var(--pc-muted)" }}>
                  <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>{row.activePct}%</span> · n = {row.n.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                <div style={{ width: `${row.activePct}%`, height: "100%", background: "var(--pc-accent)" }} />
              </div>
            </li>
          ))}
        </ul>
      </DetailSection>
      <DetailSection title="Activation by year">
        <div className="grid grid-cols-5 gap-2">
          {d.activationByYear.map((y: any) => (
            <div key={y.year} className="rounded-md p-2 text-center" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
              <div className="text-[10px]" style={{ color: "var(--pc-muted)" }}>{y.year}</div>
              <div className="mt-0.5 font-serif text-[15px] tabular-nums" style={{ color: "var(--pc-ink)" }}>{y.activePct}%</div>
            </div>
          ))}
        </div>
      </DetailSection>
      <DetailStat label="Median sessions per active student" value={d.medianSessionsPerActive.toFixed(1)} hint="Rolling 4-week window" />
    </>
  );
}

function CrisisPanel({ snap, d }: any) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="Flagged this wk" value={snap.crisisSignals.total.toLocaleString()} />
        <DetailStat label="Escalation rate" value={`${Math.round(d.escalationRate * 100)}%`} hint="High → counselor route" />
        <DetailStat
          label="Median response · high"
          value={`${d.responseHours[0].medianH}h`}
          hint={`p90 ${d.responseHours[0].p90H}h`}
        />
        <DetailStat
          label="Median response · medium"
          value={`${d.responseHours[1].medianH}h`}
          hint={`p90 ${d.responseHours[1].p90H}h`}
        />
      </div>
      <DetailSection title="Severity over 12 weeks" subtitle="Stacked view of low / medium / high counts.">
        <div className="rounded-lg p-3" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
          <Sparkbar
            values={d.weekly12.map((w: any) => w.low + w.medium + w.high)}
            labels={d.weekly12.map((w: any) => w.week)}
            width={640}
            height={90}
            unit=" flags"
            ariaLabel="Weekly crisis flag totals"
          />
        </div>
        <div className="mt-3 space-y-1.5">
          {d.weekly12.slice(-4).reverse().map((w: any) => (
            <div key={w.week} className="grid grid-cols-4 text-[11px] tabular-nums gap-1.5">
              <span style={{ color: "var(--pc-muted)" }}>{w.week}</span>
              <span style={{ color: "var(--pc-good)" }}>low {w.low}</span>
              <span style={{ color: "var(--pc-accent-2)" }}>med {w.medium}</span>
              <span style={{ color: "var(--pc-danger)" }}>high {w.high}</span>
            </div>
          ))}
        </div>
      </DetailSection>
      <DetailSection title="Response channels" subtitle="Where first contact came from.">
        <Donut
          slices={d.channelSplit.map((c: any) => ({ label: c.channel, value: c.n }))}
          centerLabel="First contact"
          size={160}
          ariaLabel="Response channel split"
        />
      </DetailSection>
      <div className="rounded-md p-3 text-[11.5px] flex gap-2" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}>
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>{d.aggregateNote}</span>
      </div>
    </>
  );
}

function SessionsPanel({ snap, d }: any) {
  const trendData = d.daily30.map((p: any) => ({ x: p.day, y: p.n }));
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="This week" value={snap.sessionsThisWeek.n.toLocaleString()} hint={`Δ ${snap.sessionsThisWeek.deltaPct >= 0 ? "+" : ""}${snap.sessionsThisWeek.deltaPct}% WoW`} />
        <DetailStat label="Median length" value={`${d.medianLengthMin}m`} hint={`Avg ${d.avgLengthMin}m`} />
        <DetailStat label="No-show" value={`${d.noShowPct}%`} />
        <DetailStat label="Reschedule" value={`${d.reschedulePct}%`} />
      </div>
      <DetailSection title="Daily sessions · last 30 days">
        <TrendArea data={trendData} ariaLabel="Daily sessions over 30 days" seriesLabel="Sessions" height={180} />
      </DetailSection>
      <DetailSection title="Modality mix">
        <Donut
          slices={d.modality.map((m: any) => ({ label: m.label, value: m.n }))}
          centerLabel="Delivered"
          size={160}
          ariaLabel="Session modality split"
        />
      </DetailSection>
      <DetailSection title="Counsellor utilisation">
        <div className="flex items-center gap-4">
          <RadialProgress
            value={d.utilizationPct}
            size={120}
            label="Booked / offered"
            sublabel="This week"
            target={80}
            hint="Green tick marks the 80% capacity guideline."
          />
          <div className="text-[12px] space-y-1" style={{ color: "var(--pc-ink-2)" }}>
            <div>Rolling 4-week mean: <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>71.4%</span></div>
            <div>Peer benchmark: <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>68.0%</span></div>
            <div>Slots offered / wk: <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>1,580</span></div>
          </div>
        </div>
      </DetailSection>
    </>
  );
}

function MoodPanel({ snap, d }: any) {
  const maxBucket = Math.max(...d.distribution.map((b: any) => b.n));
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="Mean" value={`${snap.avgMood.score.toFixed(1)}/10`} hint={`Δ ${snap.avgMood.deltaPts >= 0 ? "+" : ""}${snap.avgMood.deltaPts} pts`} />
        <DetailStat label="Responses" value={snap.avgMood.responses.toLocaleString()} />
        <DetailStat label="12-wk range" value={`${Math.min(...d.weekly12.map((w: any) => w.mean))}–${Math.max(...d.weekly12.map((w: any) => w.mean))}`} />
        <DetailStat label="Best day" value={d.perDay.reduce((a: any, b: any) => (b.mean > a.mean ? b : a)).day} />
      </div>
      <DetailSection title="Distribution · 1 (worst) → 10 (best)">
        <div className="flex items-end gap-1.5 h-32">
          {d.distribution.map((b: any) => (
            <div key={b.bucket} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(b.n / maxBucket) * 100}%`,
                  minHeight: 2,
                  background: "var(--pc-accent)",
                  opacity: 0.4 + (Number(b.bucket) / 10) * 0.6,
                }}
                title={`${b.bucket}: ${b.n} responses`}
              />
              <span className="text-[10px]" style={{ color: "var(--pc-muted)" }}>{b.bucket}</span>
            </div>
          ))}
        </div>
      </DetailSection>
      <DetailSection title="12-week mean with p25 / p75 band">
        <TrendArea
          data={d.weekly12.map((w: any) => ({ x: w.week, y: w.mean }))}
          ariaLabel="Weekly mean mood"
          seriesLabel="Mean"
          yDomain={[0, 10]}
          height={160}
        />
      </DetailSection>
      <DetailSection title="By day of week">
        <div className="grid grid-cols-7 gap-1.5">
          {d.perDay.map((p: any) => (
            <div key={p.day} className="rounded-md p-2 text-center" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
              <div className="text-[10px]" style={{ color: "var(--pc-muted)" }}>{p.day}</div>
              <div className="mt-0.5 font-serif text-[14px] tabular-nums" style={{ color: "var(--pc-ink)" }}>{p.mean.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </DetailSection>
      <DetailSection title="Top contributors" subtitle="Signed points contributed to this week's mean.">
        <ul className="space-y-1.5">
          {d.topContributors.map((c: any) => (
            <li key={c.label} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5" style={{ color: "var(--pc-ink-2)" }}>
                {c.direction === "up"
                  ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--pc-good)" }} />
                  : <ArrowDownRight className="w-3.5 h-3.5" style={{ color: "var(--pc-warn)" }} />}
                {c.label}
              </span>
              <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>{c.pts >= 0 ? "+" : ""}{c.pts.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </DetailSection>
    </>
  );
}

function DepartmentsPanel({ d }: any) {
  return (
    <DetailSection title="All departments" subtitle="Sortable rows. Click a name to open the deep-dive.">
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--pc-border)" }}>
        <table className="w-full text-[12px]">
          <thead style={{ background: "var(--pc-surface2)" }}>
            <tr className="text-left" style={{ color: "var(--pc-muted)" }}>
              <th className="px-3 py-2 font-normal">Department</th>
              <th className="px-3 py-2 font-normal text-right">Participation</th>
              <th className="px-3 py-2 font-normal text-right">Wellness</th>
              <th className="px-3 py-2 font-normal text-right">Flag %</th>
              <th className="px-3 py-2 font-normal text-right">Δ WoW</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((row: any) => (
              <tr key={row.slug} className="border-t" style={{ borderColor: "var(--pc-border)" }}>
                <td className="px-3 py-2">
                  <a href={`/departments?dept=${row.slug}`} style={{ color: "var(--pc-ink)" }} className="hover:underline">
                    {row.name}
                  </a>
                  <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>n = {row.n.toLocaleString()} · {row.sessionsWk}/wk sessions</div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--pc-ink-2)" }}>{row.participationPct}%</td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--pc-ink-2)" }}>{row.wellnessIndex}</td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--pc-ink-2)" }}>{row.riskFlagPct}%</td>
                <td className="px-3 py-2 text-right">
                  <DeltaChip delta={row.deltaVsPrior} unit=" pts" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DetailSection>
  );
}

function TrendPanel({ d }: any) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="26-week peak" value={Math.max(...d.extended26w.map((w: any) => w.overall))} />
        <DetailStat label="26-week low" value={Math.min(...d.extended26w.map((w: any) => w.overall))} />
        <DetailStat label="Latest overall" value={d.extended26w[d.extended26w.length - 1].overall} />
        <DetailStat label="Peer benchmark" value={d.benchmarkPeer} hint="Median of 14 institutions" />
      </div>
      <DetailSection title="Overall · 26 weeks">
        <TrendArea
          data={d.extended26w.map((w: any) => ({ x: w.week, y: w.overall }))}
          ariaLabel="Overall wellness trend, 26 weeks"
          seriesLabel="Overall"
          yDomain={[40, 100]}
          height={180}
        />
      </DetailSection>
      <DetailSection title="First-year vs final-year">
        <TrendArea
          data={d.extended26w.map((w: any) => ({ x: w.week, y: w.firstYear }))}
          ariaLabel="First-year wellness trend"
          seriesLabel="First-year"
          yDomain={[40, 100]}
          height={140}
        />
        <TrendArea
          data={d.extended26w.map((w: any) => ({ x: w.week, y: w.finalYear }))}
          ariaLabel="Final-year wellness trend"
          seriesLabel="Final-year"
          yDomain={[40, 100]}
          height={140}
        />
      </DetailSection>
      <DetailSection title="Academic calendar" subtitle="Contextual markers on the trend line.">
        <ul className="grid grid-cols-2 gap-2">
          {d.academicMarkers.map((m: any) => (
            <li key={m.week} className="rounded-md p-2 text-[12px]" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
              <span style={{ color: "var(--pc-muted)" }}>{m.week}</span>
              <span className="mx-2" style={{ color: "var(--pc-border)" }}>·</span>
              <span style={{ color: "var(--pc-ink)" }}>{m.label}</span>
            </li>
          ))}
        </ul>
      </DetailSection>
    </>
  );
}

function FunnelPanel({ d }: any) {
  return (
    <>
      <DetailSection title="Stage-by-stage view">
        <FunnelBars
          steps={d.stages.map((s: any) => ({ label: s.label, value: s.n, hint: s.note }))}
          ariaLabel="Care funnel"
          unit="students"
        />
      </DetailSection>
      <DetailSection title="Conversion vs peer benchmark">
        <ul className="space-y-2">
          {d.stages.map((s: any) => {
            const gap = s.conversion !== null && s.benchmark !== null ? s.conversion - s.benchmark : null;
            return (
              <li key={s.key} className="rounded-md p-3" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{s.label}</span>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--pc-muted)" }}>
                    {s.conversion !== null ? `${s.conversion}% conversion` : "entry stage"}
                  </span>
                </div>
                <div className="text-[11.5px] mt-1" style={{ color: "var(--pc-muted)" }}>{s.note}</div>
                <div className="flex items-center gap-3 mt-2 text-[11px] tabular-nums">
                  <span style={{ color: "var(--pc-ink-2)" }}>n = {s.n.toLocaleString()}</span>
                  <span style={{ color: "var(--pc-muted)" }}>Median: {s.median}</span>
                  {s.benchmark !== null && (
                    <span style={{ color: "var(--pc-muted)" }}>Benchmark: {s.benchmark}%</span>
                  )}
                  {gap !== null && (
                    <span style={{ color: gap >= 0 ? "var(--pc-good)" : "var(--pc-warn)" }}>
                      {gap >= 0 ? "+" : ""}{gap}pt vs peer
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </DetailSection>
      <div className="rounded-md p-3 text-[12px] flex gap-2" style={{ background: "color-mix(in oklab, var(--pc-warn) 12%, var(--pc-surface2))", border: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}>
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--pc-warn)" }} />
        <span><strong style={{ color: "var(--pc-ink)" }}>Tightest stage: </strong>{d.bottleneckNote}</span>
      </div>
    </>
  );
}

function ConcernsPanel({ d }: any) {
  return (
    <DetailSection title="Per-tag context" subtitle="12-week trend, WoW change, and top schools per tag.">
      <ul className="space-y-3">
        {d.perTag.map((t: any) => {
          const suppressed = t.n === 0;
          return (
            <li key={t.tag} className="rounded-lg p-3" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{t.tag}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] tabular-nums" style={{ color: "var(--pc-ink-2)" }}>
                    {suppressed ? "—" : t.n.toLocaleString()}
                  </span>
                  {!suppressed && <DeltaChip delta={t.deltaPct} unit="%" />}
                </div>
              </div>
              {!suppressed && (
                <>
                  <div className="mt-2">
                    <Sparkbar values={t.trend12w} width={480} height={28} unit=" mentions" ariaLabel={`${t.tag} 12-week trend`} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.topSchools.map((s: any) => (
                      <span
                        key={s.school}
                        className="text-[10.5px] px-2 py-0.5 rounded-full"
                        style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}
                      >
                        {s.school} · {s.sharePct}%
                      </span>
                    ))}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </DetailSection>
  );
}

function HeatmapPanel({ d }: any) {
  const maxDay = Math.max(...d.perDayTotals.map((x: any) => x.n), 1);
  const maxHour = Math.max(...d.perHourTotals.map((x: any) => x.n), 1);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DetailStat label="Peak" value={`${d.peak.day} ${d.peak.hour}`} hint={`${d.peak.n} sessions`} />
        <DetailStat label="Quietest" value={`${d.quiet.day} ${d.quiet.hour}`} hint={`${d.quiet.n} sessions`} />
        <DetailStat label="Weekday share" value={`${d.weekdayVsWeekendPct.weekday}%`} />
        <DetailStat label="Weekend share" value={`${d.weekdayVsWeekendPct.weekend}%`} />
      </div>
      <DetailSection title="Volume by day of week">
        <ul className="space-y-1.5">
          {d.perDayTotals.map((row: any) => (
            <li key={row.day}>
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: "var(--pc-ink-2)" }}>{row.day}</span>
                <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>{row.n.toLocaleString()}</span>
              </div>
              <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                <div style={{ width: `${(row.n / maxDay) * 100}%`, height: "100%", background: "var(--pc-accent)" }} />
              </div>
            </li>
          ))}
        </ul>
      </DetailSection>
      <DetailSection title="Volume by 2-hour bucket">
        <ul className="space-y-1.5">
          {d.perHourTotals.map((row: any) => (
            <li key={row.hour}>
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: "var(--pc-ink-2)" }}>{row.hour}</span>
                <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>{row.n.toLocaleString()}</span>
              </div>
              <div className="h-1.5 mt-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                <div style={{ width: `${(row.n / maxHour) * 100}%`, height: "100%", background: "var(--pc-accent)" }} />
              </div>
            </li>
          ))}
        </ul>
      </DetailSection>
    </>
  );
}

function MethodologyNote({ text }: { text: string }) {
  return (
    <div
      className="rounded-md p-3 text-[11.5px] flex gap-2"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}
    >
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

// Silence unused-import warnings from utility helpers referenced above.
export const __used = { isSuppressed, KpiNumber };
