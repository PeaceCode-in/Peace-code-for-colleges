// Care Routing — a routing-first companion to /care/risk.
// Focus: how detected concern moves through outreach → contact → intake →
// completion, which channels carry it, which schools lag, and where the
// funnel leaks. Aggregate-only, k=10 floor enforced by every selector.
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AlertTriangle, ArrowRight, Radio, Clock, Users, GitBranch } from "lucide-react";
import {
  GlassCard,
  PageHeader,
  AnonymityBadge,
} from "@/components/college/primitives";
import { FilterChipGroup } from "@/components/primitives/FilterChipGroup";
import { SlaChip } from "@/components/primitives/SlaChip";
import { AlertRow } from "@/components/primitives/AlertRow";
import { RoutingFunnel } from "@/components/early-warning/RoutingFunnel";
import { TimeToContact } from "@/components/early-warning/TimeToContact";
import { ChannelBreakdown } from "@/components/early-warning/ChannelBreakdown";
import { BottleneckMatrix } from "@/components/early-warning/BottleneckMatrix";
import { SchoolResponseTimes } from "@/components/early-warning/SchoolResponseTimes";
import { ReassessmentAdherence } from "@/components/early-warning/ReassessmentAdherence";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";
import { Donut } from "@/components/viz/Donut";
import { FunnelBars } from "@/components/viz/FunnelBars";
import {
  activeCohortFor,
  getFunnel,
  getChannelBreakdown,
  getTimeToContact,
  getAdherence,
  getSystemHealth,
  snapshotAsOf,
  windowLabel,
  isSuppressed,
  type EwWindowKey,
} from "@/lib/early-warning-selectors";

const searchSchema = z.object({
  window: fallback(z.string(), "30d").default("30d"),
});

const WINDOW_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "term", label: "This term" },
];

function toWindow(v: string): EwWindowKey {
  return (["7d", "30d", "90d", "term"] as const).includes(v as EwWindowKey)
    ? (v as EwWindowKey)
    : "30d";
}

export const Route = createFileRoute("/_authenticated/care/routing")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Care Routing — PeaceCode for Colleges" },
      {
        name: "description",
        content:
          "Aggregate routing funnel, channel mix, time-to-contact, and per-school lag. No individual student is identifiable.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoutingPage,
});

function RoutingPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const window: EwWindowKey = toWindow(search.window);

  const activeN = activeCohortFor(window);
  const asOf = snapshotAsOf(window);
  const funnel = useMemo(() => getFunnel(window), [window]);
  const channels = useMemo(() => getChannelBreakdown(window), [window]);
  const ttc = useMemo(() => getTimeToContact(window), [window]);
  const adherence = useMemo(() => getAdherence(window), [window]);
  const system = useMemo(() => getSystemHealth(window), [window]);

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }),
      replace: true,
    });
  };

  const sla = system.sla24h.withinPct;
  const slaStatus = sla >= 90 ? "on" : sla >= 75 ? "warn" : "breach";

  // ── Derive KPI strip values (all aggregate, all k-safe) ──
  const funnelSteps = !isSuppressed(funnel) ? funnel.steps : [];
  const detected = funnelSteps[0]?.n ?? 0;
  const contacted = funnelSteps.find((s) => s.key === "accepted")?.n
    ?? funnelSteps[funnelSteps.length - 2]?.n
    ?? 0;
  const completed = funnelSteps[funnelSteps.length - 1]?.n ?? 0;
  const contactRate = detected > 0 ? (contacted / detected) * 100 : 0;
  const completionRate = detected > 0 ? (completed / detected) * 100 : 0;
  const worstStep = funnelSteps
    .slice(1)
    .reduce<{ label: string; drop: number } | null>((worst, s, i) => {
      const prev = funnelSteps[i]?.n ?? 0;
      const drop = prev - s.n;
      if (!worst || drop > worst.drop) return { label: s.label, drop };
      return worst;
    }, null);

  const medianH = !isSuppressed(ttc) ? ttc.medianHours : null;
  const p90H = !isSuppressed(ttc) ? ttc.p90Hours : null;
  const peerH = !isSuppressed(ttc) ? ttc.peerMedianHours : null;
  const adherencePct = !isSuppressed(adherence) ? adherence.pct : null;
  const adherenceDelta = !isSuppressed(adherence) ? adherence.delta : null;

  // Aggregate channel totals across the weekly series.
  const chTotals = !isSuppressed(channels)
    ? channels.reduce(
        (a, w) => ({
          inApp: a.inApp + w.inApp,
          email: a.email + w.email,
          peer: a.peer + w.peer,
          counselor: a.counselor + w.counselor,
        }),
        { inApp: 0, email: 0, peer: 0, counselor: 0 },
      )
    : null;
  const chTotalAll = chTotals
    ? chTotals.inApp + chTotals.email + chTotals.peer + chTotals.counselor
    : 0;
  const donutSlices = chTotals
    ? [
        { label: "In-app nudge", value: chTotals.inApp, color: "var(--pc-accent)" },
        { label: "Email", value: chTotals.email, color: "color-mix(in oklab, var(--pc-accent) 60%, var(--pc-ink) 15%)" },
        { label: "Peer support", value: chTotals.peer, color: "color-mix(in oklab, var(--pc-accent) 35%, var(--pc-surface2))" },
        { label: "Counselor outreach", value: chTotals.counselor, color: "var(--pc-muted)" },
      ]
    : [];

  // Journey-style funnel for the second visualisation.
  const journeySteps = funnelSteps.map((s) => ({
    label: s.label,
    value: s.n,
    hint: s.note,
  }));

  return (
    <div data-noexport>
      <PageHeader
        eyebrow="Early warning & care"
        title="Care Routing"
        subtitle="How detected concern moves through outreach, contact, intake, and completion — and where it stalls. Aggregate signals, k ≥ 10."
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
          <div className="ml-auto text-[11px]" style={{ color: "var(--pc-muted)" }}>
            {windowLabel(window)} · active cohort n = {activeN.toLocaleString()} ·
            snapshot {new Date(asOf).toLocaleDateString()}
          </div>
        </div>
      </GlassCard>

      {/* KPI strip */}
      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <KpiCard
          icon={<Radio className="h-3.5 w-3.5" />}
          label="Detected"
          value={detected.toLocaleString()}
          sub={`${((detected / Math.max(activeN, 1)) * 100).toFixed(1)}% of active`}
        />
        <KpiCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Reached (accepted)"
          value={contacted.toLocaleString()}
          sub={`${contactRate.toFixed(0)}% of detected`}
          tone={contactRate < 50 ? "warn" : "ok"}
        />
        <KpiCard
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          label="Completed care"
          value={completed.toLocaleString()}
          sub={`${completionRate.toFixed(0)}% end-to-end`}
          tone={completionRate < 30 ? "warn" : "ok"}
        />
        <KpiCard
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Median time to contact"
          value={medianH !== null ? `${medianH}h` : "—"}
          sub={
            peerH !== null && medianH !== null
              ? `Peer ${peerH}h · p90 ${p90H}h`
              : "Suppressed"
          }
          tone={medianH !== null && peerH !== null && medianH > peerH ? "warn" : "ok"}
        />
        <KpiCard
          icon={<GitBranch className="h-3.5 w-3.5" />}
          label="Worst drop-off"
          value={worstStep ? worstStep.label : "—"}
          sub={worstStep ? `−${worstStep.drop.toLocaleString()} students` : "n/a"}
          tone="warn"
        />
        <KpiCard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="28-day reassessment"
          value={adherencePct !== null ? `${adherencePct.toFixed(0)}%` : "—"}
          sub={
            adherenceDelta !== null
              ? `${adherenceDelta >= 0 ? "▲" : "▼"} ${Math.abs(adherenceDelta).toFixed(1)}pt vs prior`
              : "Suppressed"
          }
          tone={adherenceDelta !== null && adherenceDelta < 0 ? "warn" : "ok"}
        />
      </div>

      {/* Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Row 1 — funnel + journey conversion */}
        <GlassCard className="p-5 lg:col-span-5 min-h-[360px]">
          <RoutingFunnel window={window} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-7 min-h-[360px]">
          <SectionHeader
            eyebrow="Step-by-step conversion"
            title="Journey retention"
            hint="Each bar is the % that survived the prior step; hover for absolute drop-offs."
          />
          {journeySteps.length > 0 ? (
            <FunnelBars
              steps={journeySteps}
              color="var(--pc-accent)"
              ariaLabel="Care routing journey retention"
              unit="students"
            />
          ) : (
            <div className="text-[12px]" style={{ color: "var(--pc-muted)" }}>
              Sample too small to display — funnel suppressed.
            </div>
          )}
        </GlassCard>

        {/* Row 2 — channel share, weekly channel mix */}
        <GlassCard className="p-5 lg:col-span-5 min-h-[340px]">
          <SectionHeader
            eyebrow={`n = ${chTotalAll.toLocaleString()} outreach events`}
            title="Channel share"
            hint="Where outreach lands, aggregated across the selected window."
          />
          <div className="flex items-center gap-6">
            <Donut
              slices={donutSlices}
              size={170}
              stroke={18}
              centerLabel={chTotalAll.toLocaleString()}
              centerSub="events"
              unit="events"
              ariaLabel="Routing channel share"
            />
            <ul className="space-y-1.5 text-[12px] flex-1 min-w-0">
              {donutSlices.map((s) => {
                const pct = chTotalAll > 0 ? (s.value / chTotalAll) * 100 : 0;
                return (
                  <li key={s.label} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    <span className="truncate" style={{ color: "var(--pc-ink-2)" }}>
                      {s.label}
                    </span>
                    <span
                      className="ml-auto tabular-nums"
                      style={{ color: "var(--pc-muted)" }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-7 min-h-[340px]">
          <ChannelBreakdown window={window} />
        </GlassCard>

        {/* Row 3 — time to contact + adherence */}
        <GlassCard className="p-5 lg:col-span-8 min-h-[320px]">
          <TimeToContact window={window} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-4 min-h-[320px]">
          <ReassessmentAdherence window={window} />
        </GlassCard>

        {/* Row 4 — bottleneck matrix + schools */}
        <GlassCard className="p-5 lg:col-span-7 min-h-[340px]">
          <BottleneckMatrix window={window} />
        </GlassCard>
        <GlassCard className="p-5 lg:col-span-5 min-h-[340px]">
          <SchoolResponseTimes window={window} />
        </GlassCard>

        {/* Row 5 — alerts */}
        <GlassCard className="p-5 lg:col-span-12 min-h-[240px]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--pc-accent-2)" }} aria-hidden />
            <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>
              Routing alerts
            </div>
            <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
              · signals fired against the current window
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {system.alerts.map((a) => (
              <AlertRow
                key={a.id}
                severity={a.severity}
                headline={a.headline}
                sub={a.sub}
                sparkline={a.sparkline}
                onOpen={() => {}}
              />
            ))}
          </div>
        </GlassCard>
      </div>

      <EthicsFooter />

      <div className="mt-4 text-center text-[11px]">
        <Link to="/care/risk" style={{ color: "var(--pc-muted)" }}>
          Risk tier populations
        </Link>
        <span className="mx-2" style={{ color: "var(--pc-border)" }}>·</span>
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

// ─── Local primitives ──────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "ok" | "warn";
}) {
  const accent = tone === "warn" ? "var(--pc-warn)" : "var(--pc-accent)";
  return (
    <GlassCard className="p-4">
      <div
        className="flex items-center gap-1.5 text-[10.5px] uppercase"
        style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}
      >
        <span style={{ color: accent }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className="mt-2 font-serif text-[24px] leading-none tabular-nums"
        style={{ color: "var(--pc-ink)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>
          {sub}
        </div>
      )}
    </GlassCard>
  );
}

function SectionHeader({
  eyebrow,
  title,
  hint,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      {eyebrow && (
        <div
          className="text-[10px] uppercase"
          style={{
            letterSpacing: "0.14em",
            color: "var(--pc-muted)",
            fontFamily: "var(--font-serif)",
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        className="font-serif text-[18px] leading-tight"
        style={{ color: "var(--pc-ink)" }}
      >
        {title}
      </div>
      {hint && (
        <div className="mt-1 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}
