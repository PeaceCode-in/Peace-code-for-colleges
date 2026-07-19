import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, ArrowRight, Download, RefreshCw, Trash2, Search } from "lucide-react";
import { TESTS, loadSessions, deleteSession, type Session } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/history")({
  head: () => ({ meta: [{ title: "History — PeaceCode Screening" }] }),
  component: History,
});

const { surface, surface2, border, ink, muted, primary } = palette;

function History() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<"all" | string>("all");
  const [status, setStatus] = useState<"all" | "completed" | "in_progress" | "abandoned">("all");
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => { setSessions(loadSessions()); }, []);
  const refresh = () => setSessions(loadSessions());

  const list = useMemo(() => sessions
    .filter((s) => filter === "all" || s.testId === filter)
    .filter((s) => status === "all" || s.status === status)
    .filter((s) => {
      if (!q.trim()) return true;
      const t = TESTS.find((x) => x.id === s.testId);
      return (t?.name + " " + t?.code).toLowerCase().includes(q.toLowerCase());
    })
    .sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt)),
    [sessions, filter, status, q]);

  const trend = useMemo(() => {
    const g: Record<string, Session[]> = {};
    sessions.filter((s) => s.status === "completed").forEach((s) => { (g[s.testId] ??= []).push(s); });
    return g;
  }, [sessions]);

  const onDelete = (id: string) => {
    if (!confirm("Delete this record?")) return;
    deleteSession(id); refresh();
  };
  const onExport = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `peacecode-screening-history.json`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span><span style={{ color: ink }}>History</span>
        </nav>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl leading-tight">Your quiet log.</h1>
            <p className="text-[13px] mt-2" style={{ color: muted }}>Every check-in you've ever taken, in one soft place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onExport} className="text-[12px] px-3 py-2 rounded-full inline-flex items-center gap-1.5" style={{ background: surface2 }}>
              <Download className="w-3.5 h-3.5" /> Export all
            </button>
            <button onClick={refresh} className="text-[12px] px-3 py-2 rounded-full inline-flex items-center gap-1.5" style={{ background: surface2 }}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* trend by test */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(trend).slice(0, 6).map(([testId, arr]) => {
            const t = TESTS.find((x) => x.id === testId); if (!t) return null;
            const points = arr.slice().sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0)).map((s) => s.scorePct ?? 0);
            return (
              <div key={testId} className="rounded-2xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>{t.code}</div>
                    <div className="font-serif text-lg mt-0.5">{t.name}</div>
                  </div>
                  <div className="text-[11px]" style={{ color: muted }}>{arr.length} entries</div>
                </div>
                <Sparkline values={points} />
              </div>
            );
          })}
          {Object.keys(trend).length === 0 && (
            <div className="col-span-full text-center py-8 text-[13px] rounded-2xl" style={{ background: surface, border: `1px solid ${border}`, color: muted }}>
              No completed screenings yet. <Link to="/screening/library" className="underline" style={{ color: primary }}>Start one</Link>.
            </div>
          )}
        </section>

        {/* filters */}
        <div className="rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: surface2 }}>
            <Search className="w-3.5 h-3.5 opacity-50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="bg-transparent outline-none text-[13px] w-full" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-[12px] px-3 py-2 rounded-full" style={{ background: surface2 }}>
            <option value="all">All tests</option>
            {TESTS.map((t) => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="text-[12px] px-3 py-2 rounded-full" style={{ background: surface2 }}>
            <option value="all">All status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        {/* table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          {list.length === 0 ? (
            <div className="text-center py-10 text-[13px]" style={{ color: muted }}>Nothing here yet.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: border }}>
              {list.map((s) => {
                const t = TESTS.find((x) => x.id === s.testId); if (!t) return null;
                return (
                  <li key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015]">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px]">{t.name} <span className="text-[11px] opacity-60">· {t.code}</span></div>
                      <div className="text-[11px] mt-0.5" style={{ color: muted }}>
                        {new Date(s.completedAt ?? s.updatedAt).toLocaleString()} · {s.status === "completed" ? s.bandLabel : s.status.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-[13px] tabular-nums w-16 text-right hidden sm:block">{s.scorePct !== undefined ? `${s.scorePct}%` : "—"}</div>
                    {s.status === "completed" ? (
                      <Link to="/screening/results/$id" params={{ id: s.id }} className="text-[12px] px-3 py-1.5 rounded-full inline-flex items-center gap-1" style={{ background: surface2 }}>
                        Review <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link to="/screening/assessment/$id" params={{ id: s.testId }} search={{ resume: s.id }} className="text-[12px] px-3 py-1.5 rounded-full" style={{ background: surface2 }}>
                        Resume
                      </Link>
                    )}
                    <button onClick={() => onDelete(s.id)} aria-label="delete" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: muted }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-[12px]">
          <Link to="/screening" className="inline-flex items-center gap-1.5" style={{ color: muted }}><ArrowLeft className="w-3.5 h-3.5" /> Screening</Link>
          <Link to="/screening/library" className="inline-flex items-center gap-1.5" style={{ color: primary }}>Take a new one <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </main>
    </AppShell>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <div className="h-14 mt-3 text-[11px] flex items-center" style={{ color: muted }}>No data yet.</div>;
  const w = 260, h = 56, pad = 4;
  const max = Math.max(100, ...values); const min = 0;
  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14 mt-3">
      <polyline points={pts} fill="none" stroke={primary} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => {
        const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="2.2" fill={primary} />;
      })}
    </svg>
  );
}
