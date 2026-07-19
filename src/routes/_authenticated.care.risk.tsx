// Early Warning & Care Routing — aggregate-only dashboard.
//
// Every tile on this page is a system-level rule over completed
// assessments. No per-student rows, no names, no IDs. The k-anonymity
// floor is enforced at the selector layer; below k=10 the tile renders
// a suppressed state — never a number.
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";
import { GlassCard, PageHeader, AnonymityBadge } from "@/components/college/primitives";
import { FilterChipGroup } from "@/components/primitives/FilterChipGroup";
import { RiskTierLegend } from "@/components/primitives/RiskTierLegend";
import { SlaChip } from "@/components/primitives/SlaChip";
import { AlertRow } from "@/components/primitives/AlertRow";
import { RiskTierTrend } from "@/components/early-warning/RiskTierTrend";
import { RoutingFunnel } from "@/components/early-warning/RoutingFunnel";
import { TimeToContact } from "@/components/early-warning/TimeToContact";
import { ChannelBreakdown } from "@/components/early-warning/ChannelBreakdown";
import { BottleneckMatrix } from "@/components/early-warning/BottleneckMatrix";
import { SchoolResponseTimes } from "@/components/early-warning/SchoolResponseTimes";
import { ReassessmentAdherence } from "@/components/early-warning/ReassessmentAdherence";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";
import {
  activeCohortFor, getTierPopulation, getSystemHealth, windowLabel,
  type EwWindowKey, type EwSegment,
} from "@/lib/early-warning-selectors";
import { RISK_TIER_COLOR, RISK_TIER_LABEL, type RiskTier } from "@/lib/clinical-scales";

const searchSchema = z.object({
  window: fallback(z.string(), "30d").default("30d"),
  seg:    fallback(z.string(), "inst").default("inst"),
  tier:   fallback(z.string(), "all").default("all"),
});

const WINDOW_OPTIONS = [
  { value: "7d",   label: "7 days" },
  { value: "30d",  label: "30 days" },
  { value: "90d",  label: "90 days" },
  { value: "term", label: "This term" },
];

const SEG_OPTIONS = [
  { value: "inst",   label: "Institution" },
  { value: "school", label: "By school" },
  { value: "year",   label: "By year" },
];

function toWindow(v: string): EwWindowKey {
  return (["7d", "30d", "90d", "term"] as const).includes(v as EwWindowKey)
    ? (v as EwWindowKey)
    : "30d";
}
function toSeg(v: string): EwSegment {
  return (["inst", "school", "year"] as const).includes(v as EwSegment)
    ? (v as EwSegment)
    : "inst";
}
function toTier(v: string): RiskTier | "all" {
  return v === "elevated" || v === "high" || v === "item9" || v === "overdue" ? (v as RiskTier) : "all";
}

export const Route = createFileRoute("/_authenticated/care/risk")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Early Warning & Care Routing — PeaceCode for Colleges" },
      { name: "description", content: "Aggregate risk-tier populations, care-routing funnel, and system-health signals. No individual student is identifiable." },
    ],
  }),
  component: EarlyWarningPage,
});

function EarlyWarningPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const window: EwWindowKey = toWindow(search.window);
  const seg: EwSegment = toSeg(search.seg);
  const tier: RiskTier | "all" = toTier(search.tier);

  const tiers = useMemo(() => getTierPopulation(window), [window]);
  const activeN = activeCohortFor(window);
  const system = useMemo(() => getSystemHealth(window), [window]);

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }), replace: true });
  };


  const sla = system.sla24h.withinPct;
  const slaStatus = sla >= 90 ? "on" : sla >= 75 ? "warn" : "breach";

  return (
    <div data-noexport>
      <PageHeader
        eyebrow="Early warning & care"
        title="Aggregate signals, routed with care"
        subtitle="Rule-based tiers over completed assessments — never per-student risk scores. Suppressed anywhere the sample would identify a person."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SlaChip status={slaStatus} text={`24h SLA · ${sla}% within`} />
            <AnonymityBadge n={activeN} k={10} />
          </div>
        }
      />

      {/* Filter bar */}
      <GlassCard tone="outlined" className="p-4 mb-6 sticky top-2 z-10">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <FilterChipGroup
            label="Window"
            options={WINDOW_OPTIONS}
            value={window}
            onChange={(v) => setSearch({ window: v })}
          />
          <FilterChipGroup
            label="Segment"
            options={SEG_OPTIONS}
            value={seg}
            onChange={(v) => setSearch({ seg: v })}
          />
          <div className="flex flex-col gap-1.5">
            <div
              className="text-[10px] uppercase"
              style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
            >
              Risk tier
            </div>
            <RiskTierLegend active={tier} onToggle={(t) => setSearch({ tier: t })} />
          </div>
          <div className="ml-auto text-[11px]" style={{ color: "var(--pc-muted)" }}>
            {windowLabel(window)} · active cohort n = {activeN.toLocaleString()}
          </div>
        </div>
      </GlassCard>

      {/* Tier population strip */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {tiers.map((t) => (
          <TierPopulationCard key={t.tier} tier={t.tier} data={t} />
        ))}
      </div>

      {/* Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="p-5 lg:col-span-8 min-h-[320px]">
          <RiskTierTrend window={window} seg={seg} focus={tier} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-4 min-h-[320px]">
          <RoutingFunnel window={window} />
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-6 min-h-[300px]">
          <TimeToContact window={window} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-6 min-h-[300px]">
          <ChannelBreakdown window={window} />
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-8 min-h-[320px]">
          <BottleneckMatrix window={window} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-4 min-h-[320px]">
          <ReassessmentAdherence window={window} />
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-7 min-h-[300px]">
          <SchoolResponseTimes window={window} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-5 min-h-[300px]">
          <AlertsFeed
            alerts={system.alerts}
            onOpen={(sev) =>
              setSearch({
                tier:
                  sev === "attention" ? "high" :
                  sev === "watch"     ? "elevated" :
                  "all",
              })
            }
          />
        </GlassCard>
      </div>

      <EthicsFooter />

      <div className="mt-4 text-center text-[11px]">
        <Link to="/care/referrals" style={{ color: "var(--pc-muted)" }}>
          Referral pipeline
        </Link>
        <span className="mx-2" style={{ color: "var(--pc-border)" }}>·</span>
        <Link to="/care/capacity" style={{ color: "var(--pc-muted)" }}>
          Counsellor capacity
        </Link>
      </div>
    </div>
  );
}

function TierPopulationCard({ tier, data }: { tier: RiskTier; data: ReturnType<typeof getTierPopulation>[number] }) {
  const trendTone = data.deltaWoW > 0 ? "var(--pc-warn)" : data.deltaWoW < 0 ? "var(--pc-good)" : "var(--pc-muted)";
  const glyph = data.deltaWoW > 0 ? "▲" : data.deltaWoW < 0 ? "▼" : "→";
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: RISK_TIER_COLOR[tier],
            border: tier === "item9" ? "1px solid var(--pc-ink)" : "none",
          }}
          aria-hidden
        />
        <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>
          {RISK_TIER_LABEL[tier]}
        </div>
      </div>
      {data.suppressed ? (
        <div className="mt-3 text-[12px]" style={{ color: "var(--pc-muted)" }}>
          Sample too small to display
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="font-serif text-[26px] leading-none tabular-nums" style={{ color: "var(--pc-ink)" }}>
              {data.count.toLocaleString()}
            </div>
            <div className="text-[11px] tabular-nums" style={{ color: "var(--pc-muted)" }}>
              {data.pctOfActive.toFixed(1)}%
            </div>
          </div>
          <div className="mt-2 text-[11px] flex items-center gap-1" style={{ color: trendTone }}>
            <span aria-hidden>{glyph}</span>
            <span>{Math.abs(data.deltaWoW)} vs last week</span>
          </div>
        </>
      )}
    </GlassCard>
  );
}

function AlertsFeed({
  alerts,
  onOpen,
}: {
  alerts: ReturnType<typeof getSystemHealth>["alerts"];
  onOpen: (severity: "info" | "attention" | "watch") => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4" style={{ color: "var(--pc-accent-2)" }} aria-hidden />
        <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>
          Signal alerts
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 320 }}>
        {alerts.map((a) => (
          <AlertRow
            key={a.id}
            severity={a.severity}
            headline={a.headline}
            sub={a.sub}
            sparkline={a.sparkline}
            onOpen={() => onOpen(a.severity)}
          />
        ))}
      </div>
    </div>
  );
}
