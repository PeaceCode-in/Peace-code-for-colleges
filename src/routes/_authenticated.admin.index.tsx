import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard, StatTile } from "@/components/college/primitives";
import { MaskedEmail } from "@/components/primitives/MaskedEmail";
import { ACTION_LABEL, formatTimestamp } from "@/components/admin/AuditTable";
import { overviewMetrics, useAdminState } from "@/lib/admin-mock";
import { useCollegeContext } from "@/lib/college-context";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — PeaceCode for Colleges" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const college = useCollegeContext();
  const members = useAdminState((s) => s.members);
  const audit = useAdminState((s) => s.audit);
  const policies = useAdminState((s) => s.policies);
  const m = overviewMetrics();
  const recent = audit.slice(0, 10);

  const seats = members.length;
  const lastAgg = new Date(m.lastAggregationISO);
  const lastAggLabel = lastAgg.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-5 md:col-span-2">
          <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>Institution</div>
          <div className="font-serif text-[22px] mt-1" style={{ color: "var(--pc-ink)" }}>
            {college?.name ?? "Your institution"}
          </div>
          <div className="mt-3 text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
            Institution ID <span className="font-mono" style={{ color: "var(--pc-ink-2)" }}>{college?.id ?? "—"}</span>
            <span className="mx-2">·</span>
            Plan <span style={{ color: "var(--pc-ink-2)" }}>Institutional</span>
            <span className="mx-2">·</span>
            Seats <span style={{ color: "var(--pc-ink-2)" }}>{seats}</span>
            <span className="mx-2">·</span>
            k = <span style={{ color: "var(--pc-ink-2)" }}>{policies.kThreshold}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {policies.domains.map((d) => (
              <span key={d} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-mono"
                style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}>
                @{d}
              </span>
            ))}
          </div>
        </GlassCard>
        <StatTile label="Active admins" value={m.activeAdmins} delta={`${m.activeAdmins30d} active in 30d`} trend="flat" />
        <StatTile label="Export success" value={`${m.exportSuccessRate}%`} delta={`${m.failedLogins} failed logins`} trend={m.exportSuccessRate >= 95 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 md:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>Recent activity</div>
              <div className="font-serif text-[16px] mt-1" style={{ color: "var(--pc-ink)" }}>Last 10 admin actions</div>
            </div>
            <Link to="/admin/audit" className="text-[12px]" style={{ color: "var(--pc-primary)" }}>Open audit log →</Link>
          </div>
          <ul className="mt-4 divide-y" style={{ borderColor: "var(--pc-border)" }}>
            {recent.map((e) => {
              const t = formatTimestamp(e.timestampISO);
              const ok = e.result === "ok";
              return (
                <li key={e.id} className="py-2.5 flex items-start gap-3">
                  <span style={{ color: ok ? "var(--pc-good)" : "var(--pc-warn)" }} aria-hidden>
                    {ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 mt-0.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px]" style={{ color: "var(--pc-ink)" }}>
                      {ACTION_LABEL[e.action]}
                      <span className="mx-1.5" style={{ color: "var(--pc-muted)" }}>·</span>
                      <span className="font-mono text-[11.5px]" style={{ color: "var(--pc-ink-2)" }}>{e.target}</span>
                    </div>
                    <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: "var(--pc-muted)" }}>
                      <MaskedEmail email={e.actorEmail} /> · {t.local}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>System health</div>
          <div className="font-serif text-[16px] mt-1" style={{ color: "var(--pc-ink)" }}>Aggregation & access</div>
          <dl className="mt-4 space-y-3 text-[12.5px]">
            <Row label="Last aggregation" value={lastAggLabel} good />
            <Row label="Export success (30d)" value={`${m.exportSuccessRate}%`} good={m.exportSuccessRate >= 95} />
            <Row label="Failed logins (30d)" value={String(m.failedLogins)} good={m.failedLogins < 10} />
            <Row label="k-threshold" value={`≥ ${policies.kThreshold}`} good />
          </dl>
        </GlassCard>
      </div>

      <EthicsFooter />
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt style={{ color: "var(--pc-muted)" }}>{label}</dt>
      <dd className="inline-flex items-center gap-1.5" style={{ color: "var(--pc-ink)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: good ? "var(--pc-good)" : "var(--pc-warn)" }} />
        <span className="tabular-nums">{value}</span>
      </dd>
    </div>
  );
}
