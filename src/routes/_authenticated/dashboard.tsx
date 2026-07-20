import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/college/primitives";
import { getExecutiveSnapshot } from "@/lib/dashboard-mock";
import { isSuppressed } from "@/lib/anonymity";
import { BentoTile } from "@/components/dashboard/BentoTile";
import { KpiNumber } from "@/components/dashboard/KpiNumber";
import { DeltaChip } from "@/components/dashboard/DeltaChip";
import { SuppressedChip } from "@/components/dashboard/SuppressedChip";
import { WellnessPulse } from "@/components/dashboard/WellnessPulse";
import { DepartmentBreakdown } from "@/components/dashboard/DepartmentBreakdown";
import { WellnessTrendChart } from "@/components/dashboard/WellnessTrendChart";
import { RiskFunnel } from "@/components/dashboard/RiskFunnel";
import { ConcernTags } from "@/components/dashboard/ConcernTags";
import { EngagementHeatmap } from "@/components/dashboard/EngagementHeatmap";
import { TileDetailSheet } from "@/components/dashboard/TileDetailSheet";
import { TileDetailPanel, TILE_META, type TileKey } from "@/components/dashboard/TileDetails";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Executive overview — PeaceCode for Colleges" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const snap = useMemo(() => getExecutiveSnapshot(), []);
  const enrolledLabel = snap.enrolledTotal.toLocaleString();
  const [openKey, setOpenKey] = useState<TileKey | null>(null);
  const open = (k: TileKey) => () => setOpenKey(k);
  const meta = openKey ? TILE_META[openKey] : null;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Executive dashboard"
        subtitle="A single-glance read of your institution's wellbeing state. Every tile enforces the anonymity floor — cohorts smaller than the threshold are suppressed automatically."
      />
      <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12 gap-4">
        {/* Row 1 — hero + 2x2 KPI cluster ────────────────────── */}
        <WellnessPulse snap={snap} className="xl:col-span-6 xl:row-span-2 lg:col-span-6" />

        {/* Active students */}
        <BentoTile
          title="Active students"
          eyebrow="Logged in this week"
          className="xl:col-span-3 lg:col-span-3"
        >
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <KpiNumber
                value={snap.activeStudents.n.toLocaleString()}
                suffix={`of ${enrolledLabel} enrolled`}
                size="lg"
              />
              <div className="mt-2">
                <DeltaChip delta={snap.activeStudents.trendDeltaPct} unit="%" />
              </div>
            </div>
            <MicroDonut
              pct={Math.round((snap.activeStudents.n / snap.activeStudents.ofTotal) * 100)}
            />
          </div>
        </BentoTile>

        {/* Crisis signals */}
        <BentoTile
          title="Crisis signals"
          eyebrow="Early-warning model"
          tone={snap.crisisSignals.highActive ? "danger" : "default"}
          className="xl:col-span-3 lg:col-span-3"
        >
          <KpiNumber
            value={snap.crisisSignals.total.toLocaleString()}
            suffix="flagged this week"
          />
          <ul className="mt-3 flex gap-3" role="list">
            {snap.crisisSignals.severity.map((b) => {
              const dotColor =
                b.key === "high"
                  ? "var(--pc-danger)"
                  : b.key === "medium"
                    ? "var(--pc-accent-2)"
                    : "var(--pc-good)";
              return (
                <li key={b.key} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full"
                    style={{ background: dotColor }}
                  />
                  <span style={{ color: "var(--pc-ink-2)" }}>{b.label}</span>
                  <span style={{ color: "var(--pc-ink)" }}>
                    {isSuppressed(b.n) ? <SuppressedChip compact /> : (b.n as number)}
                  </span>
                </li>
              );
            })}
          </ul>
        </BentoTile>

        {/* Sessions this week */}
        <BentoTile
          title="Sessions this week"
          eyebrow="Delivered · 7 days"
          className="xl:col-span-3 lg:col-span-3"
        >
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <KpiNumber
                value={snap.sessionsThisWeek.n.toLocaleString()}
                size="lg"
              />
              <div className="mt-2">
                <DeltaChip delta={snap.sessionsThisWeek.deltaPct} unit="%" />
              </div>
            </div>
            <MiniBars values={snap.sessionsThisWeek.lastSevenDays} />
          </div>
        </BentoTile>

        {/* Avg mood */}
        <BentoTile
          title="Average mood"
          eyebrow="Self-report · 1–10"
          className="xl:col-span-3 lg:col-span-3"
        >
          <div className="flex items-end gap-2">
            <KpiNumber value={snap.avgMood.score.toFixed(1)} suffix="/ 10" size="lg" />
            <DeltaChip delta={snap.avgMood.deltaPts} unit=" pts" />
          </div>
          <div
            className="mt-3 h-2 rounded-full overflow-hidden"
            style={{ background: "var(--pc-surface2)" }}
            aria-hidden
          >
            <div
              style={{
                width: `${(snap.avgMood.score / 10) * 100}%`,
                height: "100%",
                background: "var(--pc-accent)",
                transition: "width 260ms ease",
              }}
            />
          </div>
          <div className="mt-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>
            n = {snap.avgMood.responses.toLocaleString()} responses
          </div>
        </BentoTile>

        {/* Row 2 ─────────────────────────────────────────────── */}
        <DepartmentBreakdown snap={snap} className="xl:col-span-3 lg:col-span-6" />
        <WellnessTrendChart snap={snap} className="xl:col-span-9 lg:col-span-6" />

        {/* Row 3 ─────────────────────────────────────────────── */}
        <RiskFunnel snap={snap} className="xl:col-span-4 lg:col-span-6" />
        <ConcernTags snap={snap} className="xl:col-span-4 lg:col-span-6" />
        <EngagementHeatmap snap={snap} className="xl:col-span-4 lg:col-span-6" />
      </div>
    </>
  );
}

// ─── Local KPI utilities ──────────────────────────────────────
function MicroDonut({ pct }: { pct: number }) {
  const size = 56;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pc-surface2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--pc-accent)"
          strokeWidth={stroke}
          strokeDasharray={`${c * (p / 100)} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 grid place-items-center text-[10px]"
        style={{ color: "var(--pc-ink)" }}
      >
        {p}%
      </div>
    </div>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1 h-12" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-t"
          style={{
            height: `${(v / max) * 100}%`,
            background: "var(--pc-accent)",
            opacity: 0.4 + (v / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}
