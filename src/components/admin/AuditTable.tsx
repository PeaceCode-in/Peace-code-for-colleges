import { useMemo } from "react";
import { GlassCard } from "@/components/college/primitives";
import { MaskedEmail } from "@/components/primitives/MaskedEmail";
import { RoleBadge } from "./RoleBadge";
import { useAdminState, type AdminActionKey, type AuditEntry } from "@/lib/admin-mock";
import { CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, YAxis } from "recharts";

export const ACTION_LABEL: Record<AdminActionKey, string> = {
  "member.invited":      "Member invited",
  "member.role_changed": "Role changed",
  "member.disabled":     "Member disabled",
  "member.removed":      "Member removed",
  "member.reveal":       "Email revealed",
  "policy.updated":      "Policy updated",
  "policy.domain_added": "Domain added",
  "policy.domain_removed": "Domain removed",
  "report.generated":    "Report generated",
  "report.exported":     "Report exported",
  "session.revoked_all": "All sessions revoked",
  "audit.export":        "Audit log exported",
};

const CATEGORY: Record<AdminActionKey, "member" | "policy" | "report" | "session" | "audit"> = {
  "member.invited": "member", "member.role_changed": "member", "member.disabled": "member",
  "member.removed": "member", "member.reveal": "member",
  "policy.updated": "policy", "policy.domain_added": "policy", "policy.domain_removed": "policy",
  "report.generated": "report", "report.exported": "report",
  "session.revoked_all": "session",
  "audit.export": "audit",
};

export function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const utc = d.toISOString().replace("T", " ").slice(0, 16) + "Z";
  const local = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return { utc, local };
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <div className="font-serif text-[16px]" style={{ color: "var(--pc-ink)" }}>No audit entries</div>
        <div className="mt-1 text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
          No audit entries in the selected window match these filters.
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Audit log entries</caption>
          <thead>
            <tr style={{ background: "var(--pc-surface2)" }}>
              {["Timestamp (UTC)", "Actor", "Action", "Target", "IP hash", "Result"].map((h) => (
                <th key={h} className="text-[10.5px] uppercase px-4 py-2.5 font-normal"
                    style={{ letterSpacing: "0.12em", color: "var(--pc-muted)", borderBottom: "1px solid var(--pc-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const t = formatTimestamp(e.timestampISO);
              const ok = e.result === "ok";
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--pc-border)" }}>
                  <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: "var(--pc-ink)" }}>
                    <div>{t.utc}</div>
                    <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{t.local}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MaskedEmail email={e.actorEmail} />
                      <RoleBadge role={e.actorRole} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: "var(--pc-ink)" }}>{ACTION_LABEL[e.action]}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px]" style={{ color: "var(--pc-ink-2)" }}>{maskTarget(e.target)}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px]" style={{ color: "var(--pc-muted)" }}>{e.ipHash}…</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--pc-surface2)",
                        color: ok ? "var(--pc-good)" : "var(--pc-warn)",
                        border: "1px solid var(--pc-border)",
                      }}
                    >
                      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {ok ? "ok" : "denied"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function maskTarget(t: string) {
  // "member:m3" stays as-is (already opaque); "report:board-snapshot" too.
  return t;
}

// ─── Weekly activity chart ──────────────────────────────────────
export function ActivityChart({ entries }: { entries: AuditEntry[] }) {
  const data = useMemo(() => {
    const weeks = 8;
    const now = Date.now();
    const buckets: { label: string; member: number; policy: number; report: number; session: number; audit: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const start = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const end = now - i * 7 * 24 * 60 * 60 * 1000;
      const b = { label: `W-${i}`, member: 0, policy: 0, report: 0, session: 0, audit: 0 };
      for (const e of entries) {
        const t = new Date(e.timestampISO).getTime();
        if (t >= start && t < end) b[CATEGORY[e.action]]++;
      }
      buckets.push(b);
    }
    return buckets;
  }, [entries]);
  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--pc-ink)" }}
          />
          <Bar dataKey="member"  stackId="a" fill="var(--pc-primary)" />
          <Bar dataKey="policy"  stackId="a" fill="color-mix(in oklab, var(--pc-primary) 60%, var(--pc-surface2))" />
          <Bar dataKey="report"  stackId="a" fill="var(--pc-good)" />
          <Bar dataKey="session" stackId="a" fill="var(--pc-warn)" />
          <Bar dataKey="audit"   stackId="a" fill="var(--pc-muted)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopActions({ entries }: { entries: AuditEntry[] }) {
  const counts = new Map<AdminActionKey, number>();
  for (const e of entries) counts.set(e.action, (counts.get(e.action) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = top[0]?.[1] ?? 1;
  return (
    <ul className="space-y-2">
      {top.map(([k, n]) => (
        <li key={k}>
          <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--pc-ink)" }}>
            <span>{ACTION_LABEL[k]}</span>
            <span className="tabular-nums" style={{ color: "var(--pc-muted)" }}>{n}</span>
          </div>
          <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
            <div className="h-full" style={{ width: `${Math.round((n / max) * 100)}%`, background: "var(--pc-primary)" }} />
          </div>
        </li>
      ))}
      {top.length === 0 && <li className="text-[12px]" style={{ color: "var(--pc-muted)" }}>Nothing to show yet.</li>}
    </ul>
  );
}
