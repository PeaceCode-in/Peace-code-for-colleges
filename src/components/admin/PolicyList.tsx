import { useState } from "react";
import { GlassCard } from "@/components/college/primitives";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  addDomain, removeDomain, revokeAllSessions,
  updateBenchmarkPolicy, updateExportPolicy, updatePolicy,
  useAdminState, useCurrentRole,
  type Policies,
} from "@/lib/admin-mock";
import { Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";

export function PolicyList() {
  const policies = useAdminState((s) => s.policies);
  const role = useCurrentRole();
  const readonly = role !== "admin";
  const [newDomain, setNewDomain] = useState("");
  const [confirm, setConfirm] = useState<null | { title: string; description: React.ReactNode; onConfirm: () => void; danger?: boolean; typeToConfirm?: string }>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const timeoutOptions: Array<Policies["sessionTimeoutMinutes"]> = [15, 30, 60, 240];
  const templateOptions: Array<Policies["defaultReportTemplate"]> = ["board-snapshot", "term-review", "regulator-packet"];

  return (
    <div className="grid gap-5">
      <Section title="k-anonymity threshold"
        subtitle="Every aggregate cell suppresses cohorts under this size. Enforced by the platform.">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--pc-ink)" }}>
          <Lock className="w-3.5 h-3.5" style={{ color: "var(--pc-muted)" }} />
          <span className="font-mono">k = {policies.kThreshold}</span>
          <span style={{ color: "var(--pc-muted)" }}>· not configurable</span>
        </div>
      </Section>

      <Section title="Export formats"
        subtitle="Turn a format off institution-wide to remove it from every export builder.">
        <div className="flex flex-wrap gap-2">
          {(["pdf", "xlsx", "csv"] as const).map((fmt) => (
            <Toggle
              key={fmt}
              label={fmt.toUpperCase()}
              value={policies.exports[fmt]}
              disabled={readonly}
              onChange={(v) => updateExportPolicy(fmt, v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Benchmark inclusion"
        subtitle="Peer and national reference lines used in reports and department views.">
        <div className="flex flex-wrap gap-2">
          <Toggle label="Peer benchmark" value={policies.benchmarks.peer} disabled={readonly}
            onChange={(v) => updateBenchmarkPolicy("peer", v)} />
          <Toggle label="National benchmark" value={policies.benchmarks.national} disabled={readonly}
            onChange={(v) => updateBenchmarkPolicy("national", v)} />
        </div>
      </Section>

      <Section title="Verified email domains"
        subtitle="Admins can only be invited if their email matches a verified domain.">
        <div className="flex flex-wrap gap-2">
          {policies.domains.map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full font-mono"
              style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
              @{d}
              {!readonly && policies.domains.length > 1 && (
                <button
                  onClick={() => setConfirm({
                    title: "Remove domain",
                    danger: true,
                    description: <>New members with <span className="font-mono">@{d}</span> emails will no longer pass verification. Existing members are unaffected.</>,
                    onConfirm: () => { removeDomain(d); toast.success(`Removed @${d}`); },
                  })}
                  className="p-0.5 rounded-full hover:bg-[color:var(--pc-surface)]"
                  aria-label={`Remove domain ${d}`}
                >
                  <X className="w-3 h-3" style={{ color: "var(--pc-muted)" }} />
                </button>
              )}
            </span>
          ))}
        </div>
        {!readonly && (
          <div className="mt-3 flex gap-2">
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)}
              placeholder="add-a-domain.edu"
              className="px-3 py-1.5 rounded-full text-[12.5px] outline-none font-mono"
              style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)", minWidth: 260 }}
            />
            <button
              onClick={() => {
                const clean = newDomain.trim().toLowerCase().replace(/^@/, "");
                if (!clean) return;
                setConfirm({
                  title: "Add verified domain",
                  description: <>Any email ending in <span className="font-mono">@{clean}</span> will pass domain verification when invited.</>,
                  onConfirm: () => { try { addDomain(clean); toast.success(`Added @${clean}`); setNewDomain(""); } catch (e) { toast.error((e as Error).message); } },
                });
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12.5px]"
              style={{ background: "var(--pc-primary)", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}
      </Section>

      <Section title="Session timeout"
        subtitle="Inactive dashboard sessions sign out automatically after this window.">
        <div className="flex flex-wrap gap-2">
          {timeoutOptions.map((m) => (
            <Toggle key={m} label={m < 60 ? `${m}m` : `${m / 60}h`} value={policies.sessionTimeoutMinutes === m}
              disabled={readonly}
              onChange={() => updatePolicy("sessionTimeoutMinutes", m)} />
          ))}
        </div>
      </Section>

      <Section title="Default report template"
        subtitle="Pre-selected when a new admin opens the report builder.">
        <div className="flex flex-wrap gap-2">
          {templateOptions.map((t) => (
            <Toggle key={t} label={t.replace(/-/g, " ")} value={policies.defaultReportTemplate === t}
              disabled={readonly}
              onChange={() => updatePolicy("defaultReportTemplate", t)} />
          ))}
        </div>
      </Section>

      {!readonly && (
        <Section title="Sign out all sessions" subtitle="Revoke every active session for this institution. Members will need to sign in again." danger>
          <button onClick={() => setRevokeOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-[12.5px]"
            style={{ background: "var(--pc-warn)", color: "white" }}
          >Revoke all sessions</button>
        </Section>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        danger={confirm?.danger}
        typeToConfirm={confirm?.typeToConfirm}
        onConfirm={() => confirm?.onConfirm()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={revokeOpen}
        danger
        typeToConfirm="REVOKE"
        title="Sign out all sessions"
        description={<>This ends every active admin and viewer session for your institution. Sign-in works again immediately. The action is audited.</>}
        confirmLabel="Revoke all"
        onConfirm={() => { revokeAllSessions(); toast.success("All sessions revoked"); }}
        onClose={() => setRevokeOpen(false)}
      />
    </div>
  );
}

function Section({ title, subtitle, children, danger }: { title: string; subtitle?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="font-serif text-[15.5px]" style={{ color: danger ? "var(--pc-warn)" : "var(--pc-ink)" }}>{title}</div>
          {subtitle && <div className="mt-1 text-[12.5px]" style={{ color: "var(--pc-muted)" }}>{subtitle}</div>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </GlassCard>
  );
}

function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="px-3 py-1.5 rounded-full text-[12.5px] capitalize disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: value ? "color-mix(in oklab, var(--pc-primary) 14%, var(--pc-surface2))" : "var(--pc-surface2)",
        color: value ? "var(--pc-primary)" : "var(--pc-ink-2)",
        border: "1px solid " + (value ? "var(--pc-primary)" : "var(--pc-border)"),
      }}
    >
      {label}
    </button>
  );
}
