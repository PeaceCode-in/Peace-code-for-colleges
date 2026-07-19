import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { GlassCard } from "@/components/college/primitives";
import { ActivityChart, AuditTable, TopActions, ACTION_LABEL } from "@/components/admin/AuditTable";
import { useAdminState, useCurrentRole, writeAudit, type AdminActionKey } from "@/lib/admin-mock";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

const RANGES = ["7d", "30d", "90d", "term"] as const;
type Range = (typeof RANGES)[number];
const RESULTS = ["all", "ok", "denied"] as const;

const auditSearch = z.object({
  q:      fallback(z.string(), "").default(""),
  action: fallback(z.string(), "all").default("all"),
  actor:  fallback(z.string(), "all").default("all"),
  result: fallback(z.string(), "all").default("all"),
  range:  fallback(z.string(), "30d").default("30d"),
  page:   fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/_authenticated/admin/audit")({
  validateSearch: zodValidator(auditSearch),
  head: () => ({ meta: [{ title: "Audit log — PeaceCode for Colleges" }] }),
  component: AuditPage,
});

const PAGE_SIZE = 50;
const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, "term": 120 };

function AuditPage() {
  const search = Route.useSearch();
  const nav = useNavigate({ from: "/admin/audit" });
  const audit = useAdminState((s) => s.audit);
  const role = useCurrentRole();

  const rangeKey: Range = (RANGES as readonly string[]).includes(search.range) ? (search.range as Range) : "30d";
  const rangeMs = RANGE_DAYS[rangeKey] * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - rangeMs;

  const actors = useMemo(() => Array.from(new Set(audit.map((e) => e.actorEmail))), [audit]);
  const actionKeys = Object.keys(ACTION_LABEL) as AdminActionKey[];

  const filtered = useMemo(() => {
    const needle = search.q.trim().toLowerCase();
    return audit.filter((e) => {
      if (new Date(e.timestampISO).getTime() < cutoff) return false;
      if (search.action !== "all" && e.action !== search.action) return false;
      if (search.actor !== "all" && e.actorEmail !== search.actor) return false;
      if (search.result !== "all" && e.result !== search.result) return false;
      if (needle) {
        const hay = `${e.actorEmail} ${e.target} ${ACTION_LABEL[e.action]}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [audit, cutoff, search]);

  const page = Math.max(1, search.page);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const set = (patch: Partial<z.infer<typeof auditSearch>>) => {
    nav({ search: (prev: z.infer<typeof auditSearch>) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });
  };

  const exportCsv = () => {
    const header = ["timestamp_utc", "actor_email_masked", "actor_role", "action", "target", "ip_hash", "result"];
    const methodology = [
      `# PeaceCode for Colleges — Audit Log Export`,
      `# Generated ${new Date().toISOString()}`,
      `# Window: ${rangeKey}   Filters: action=${search.action} actor=${search.actor} result=${search.result} q="${search.q}"`,
      `# Rows: ${filtered.length}   k-anonymity threshold enforced elsewhere: k=10`,
    ].join("\n");
    const body = filtered.map((e) => {
      const [l, d] = e.actorEmail.split("@");
      const masked = `${l[0]}****@${d}`;
      return [e.timestampISO, masked, e.actorRole, e.action, e.target, e.ipHash, e.result]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    }).join("\n");
    const csv = `${methodology}\n${header.join(",")}\n${body}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pc-audit-${rangeKey}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    writeAudit({ action: "audit.export", target: "audit:filtered", result: "ok", meta: { rows: filtered.length, range: rangeKey } });
    toast.success(`Exported ${filtered.length} audit rows`);
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--pc-muted)" }} />
            <input
              value={search.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search actor, target, action…"
              className="pl-7 pr-3 py-1.5 rounded-full text-[12.5px] outline-none"
              style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)", minWidth: 240 }}
            />
          </div>
          <Select label="Range" value={rangeKey} onChange={(v) => set({ range: v })}
            options={RANGES.map((r) => ({ value: r, label: r }))} />
          <Select label="Action" value={search.action} onChange={(v) => set({ action: v })}
            options={[{ value: "all", label: "All actions" }, ...actionKeys.map((k) => ({ value: k, label: ACTION_LABEL[k] }))]} />
          <Select label="Actor" value={search.actor} onChange={(v) => set({ actor: v })}
            options={[{ value: "all", label: "All actors" }, ...actors.map((a) => {
              const [l, d] = a.split("@"); return { value: a, label: `${l[0]}****@${d}` };
            })]} />
          <Select label="Result" value={search.result} onChange={(v) => set({ result: v })}
            options={RESULTS.map((r) => ({ value: r, label: r }))} />
          <div className="ml-auto flex items-center gap-3 text-[12px]" style={{ color: "var(--pc-muted)" }}>
            <span>{filtered.length} rows</span>
            {role === "admin" && (
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] disabled:opacity-40"
                style={{ background: "var(--pc-primary)", color: "white" }}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <AuditTable entries={pageRows} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--pc-muted)" }}>
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-1.5">
                <PageBtn disabled={page <= 1} onClick={() => set({ page: page - 1 })}>Previous</PageBtn>
                <PageBtn disabled={page >= totalPages} onClick={() => set({ page: page + 1 })}>Next</PageBtn>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <GlassCard className="p-5">
            <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>Activity</div>
            <div className="font-serif text-[15px] mt-1" style={{ color: "var(--pc-ink)" }}>Weekly, by category</div>
            <div className="mt-3"><ActivityChart entries={filtered} /></div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
              <Dot color="var(--pc-primary)"> Member</Dot>
              <Dot color="color-mix(in oklab, var(--pc-primary) 60%, var(--pc-surface2))"> Policy</Dot>
              <Dot color="var(--pc-good)"> Report</Dot>
              <Dot color="var(--pc-warn)"> Session</Dot>
              <Dot color="var(--pc-muted)"> Audit</Dot>
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>Top actions</div>
            <div className="font-serif text-[15px] mt-1 mb-3" style={{ color: "var(--pc-ink)" }}>In this window</div>
            <TopActions entries={filtered} />
          </GlassCard>
        </aside>
      </div>

      <EthicsFooter />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
      <span className="uppercase" style={{ letterSpacing: "0.1em" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 rounded-md text-[12px] outline-none"
        style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function PageBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest}
      className="px-2.5 py-1 rounded-full text-[11.5px] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
      {children}
    </button>
  );
}

function Dot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />{children}
    </span>
  );
}
