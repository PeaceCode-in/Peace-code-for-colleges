import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Trash2, Download, Calendar, List, BarChart3 } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  loadEntries, deleteEntry, computeStreak, CATEGORIES, MOODS,
  type GratitudeEntry, type Category,
} from "@/lib/gratitude-store";

export const Route = createFileRoute("/gratitude/history")({
  head: () => ({ meta: [{ title: "Gratitude History & Analytics" }] }),
  component: HistoryPage,
});

type View = "calendar" | "timeline" | "analytics";

function HistoryPage() {
  const { ink, muted, border, primary, surface, surface2 } = palette;
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [view, setView] = useState<View>("timeline");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [mood, setMood] = useState<string>("all");

  useEffect(() => { setEntries(loadEntries()); }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (q && !(e.body + " " + e.title).toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "all" && e.category !== cat) return false;
      if (mood !== "all" && e.mood !== mood) return false;
      return true;
    });
  }, [entries, q, cat, mood]);

  const { current, longest } = computeStreak(entries);

  function removeEntry(id: string) {
    if (!confirm("Delete this gratitude entry?")) return;
    deleteEntry(id); setEntries(loadEntries());
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "peacecode-gratitude.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/gratitude" className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 mb-6" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3" /> back
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif italic text-4xl sm:text-5xl leading-[1.05]" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
              your history
            </h1>
            <p className="mt-2 text-sm" style={{ color: muted }}>{entries.length} entries · streak {current} · longest {longest}</p>
          </div>
          <button onClick={exportJson} className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 px-3 py-2 rounded-full" style={{ border: `1px solid ${border}`, color: muted }}>
            <Download className="w-3 h-3" /> export
          </button>
        </div>

        {/* view tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          <ViewTab active={view === "timeline"} onClick={() => setView("timeline")} icon={<List className="w-3.5 h-3.5" />} label="timeline" />
          <ViewTab active={view === "calendar"} onClick={() => setView("calendar")} icon={<Calendar className="w-3.5 h-3.5" />} label="calendar" />
          <ViewTab active={view === "analytics"} onClick={() => setView("analytics")} icon={<BarChart3 className="w-3.5 h-3.5" />} label="analytics" />
        </div>

        {view !== "analytics" && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]" style={{ border: `1px solid ${border}` }}>
              <Search className="w-3.5 h-3.5 opacity-60" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search…" className="bg-transparent outline-none w-40" style={{ color: ink }} />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value as Category | "all")} className="text-[11px] rounded-full px-3 py-1.5 bg-transparent" style={{ border: `1px solid ${border}`, color: muted }}>
              <option value="all">all categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="text-[11px] rounded-full px-3 py-1.5 bg-transparent" style={{ border: `1px solid ${border}`, color: muted }}>
              <option value="all">all moods</option>
              {MOODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        )}

        {view === "timeline" && (
          <ul className="mt-6 space-y-3">
            {filtered.map((e) => (
              <li key={e.id} className="rounded-3xl p-5 group" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 text-[11px] mb-1.5" style={{ color: muted }}>
                  <span>{new Date(e.createdAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                  {e.category && <><span>·</span><span>{e.category}</span></>}
                  {e.mood && <><span>·</span><span>{MOODS.find((m) => m.key === e.mood)?.emoji} {e.mood}</span></>}
                  <button onClick={() => removeEntry(e.id)} className="ml-auto opacity-0 group-hover:opacity-100 transition" style={{ color: muted }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[15px] leading-relaxed" style={{ color: ink }}>{e.body}</p>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-sm opacity-60 py-10 text-center" style={{ color: muted }}>no entries match your filter.</li>}
          </ul>
        )}

        {view === "calendar" && <HeatmapCalendar entries={entries} />}
        {view === "analytics" && <AnalyticsPanel entries={entries} />}
      </div>
    </AppShell>
  );
}

function ViewTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  const { border, muted, primary } = palette;
  return (
    <button onClick={onClick} className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition"
            style={{ border: `1px solid ${active ? primary : border}`, background: active ? primary : "transparent", color: active ? "white" : muted }}>
      {icon}{label}
    </button>
  );
}

function HeatmapCalendar({ entries }: { entries: GratitudeEntry[] }) {
  const { ink, muted, border, primary, surface } = palette;
  const days = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((e) => {
      const k = e.createdAt.slice(0, 10);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const cells: { date: Date; count: number }[] = [];
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (7 * 12 - 1));
    while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 7 * 14; i++) {
      const k = d.toISOString().slice(0, 10);
      cells.push({ date: new Date(d), count: counts.get(k) ?? 0 });
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [entries]);

  function shade(n: number) {
    if (!n) return "#EAF3FF";
    if (n === 1) return "#C4D6F5";
    if (n === 2) return "#8FB1E8";
    if (n === 3) return "#6C8FD5";
    return primary;
  }

  return (
    <div className="mt-6 rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: muted }}>the last 14 weeks</div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((c, i) => (
          <div key={i} title={`${c.date.toDateString()} · ${c.count}`}
               className="w-3 h-3 rounded-[3px]" style={{ background: shade(c.count) }} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px]" style={{ color: muted }}>
        less <div className="flex gap-1">{[0,1,2,3,4].map((n) => <div key={n} className="w-3 h-3 rounded-[3px]" style={{ background: shade(n) }} />)}</div> more
      </div>
    </div>
  );
}

function AnalyticsPanel({ entries }: { entries: GratitudeEntry[] }) {
  const { ink, muted, border, primary, surface, surface2 } = palette;
  const total = entries.length;
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
  const weekly = entries.filter((e) => new Date(e.createdAt) >= weekAgo).length;
  const monthly = entries.filter((e) => new Date(e.createdAt) >= monthAgo).length;
  const { current, longest } = computeStreak(entries);
  const avgPerWeek = total ? Math.round((total / Math.max(1, weeksSinceFirst(entries))) * 10) / 10 : 0;

  const byCategory = new Map<string, number>();
  entries.forEach((e) => { if (e.category) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1); });
  const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCat = Math.max(1, ...topCategories.map(([, n]) => n));

  const byHour = new Array(24).fill(0);
  entries.forEach((e) => { byHour[new Date(e.createdAt).getHours()]++; });
  const activeHour = byHour.indexOf(Math.max(...byHour));

  return (
    <div className="mt-6 grid lg:grid-cols-2 gap-3">
      <Card><KV label="total" value={String(total)} /><KV label="this week" value={String(weekly)} /><KV label="this month" value={String(monthly)} /></Card>
      <Card><KV label="current streak" value={String(current)} /><KV label="longest streak" value={String(longest)} /><KV label="avg per week" value={String(avgPerWeek)} /></Card>

      <div className="rounded-3xl p-6 lg:col-span-2" style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: muted }}>top categories</div>
        {topCategories.length === 0 ? <div className="text-sm opacity-60" style={{ color: muted }}>no categories yet.</div> : (
          <div className="space-y-2.5">
            {topCategories.map(([name, n]) => (
              <div key={name} className="flex items-center gap-3 text-[13px]">
                <div className="w-32 shrink-0" style={{ color: ink }}>{name}</div>
                <div className="flex-1 h-2 rounded-full" style={{ background: surface2 }}>
                  <div className="h-full rounded-full" style={{ width: `${(n / maxCat) * 100}%`, background: primary }} />
                </div>
                <div className="tabular-nums w-8 text-right" style={{ color: muted }}>{n}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl p-6 lg:col-span-2" style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>most active time</div>
          <div className="text-[11px]" style={{ color: muted }}>peak around <span style={{ color: ink }}>{formatHour(activeHour)}</span></div>
        </div>
        <div className="flex items-end gap-1 h-24">
          {byHour.map((n, i) => (
            <div key={i} className="flex-1 rounded-t" title={`${formatHour(i)} · ${n}`}
                 style={{ height: `${(n / Math.max(1, ...byHour)) * 100}%`, background: i === activeHour ? primary : surface2, minHeight: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { border, surface } = palette;
  return <div className="rounded-3xl p-6 grid grid-cols-3 gap-4" style={{ background: surface, border: `1px solid ${border}` }}>{children}</div>;
}
function KV({ label, value }: { label: string; value: string }) {
  const { ink, muted } = palette;
  return (
    <div>
      <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>{label}</div>
      <div className="mt-1 font-serif italic text-3xl" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </div>
  );
}
function formatHour(h: number) { return `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`; }
function weeksSinceFirst(entries: GratitudeEntry[]) {
  if (!entries.length) return 1;
  const first = new Date(entries[entries.length - 1].createdAt);
  return Math.max(1, Math.ceil((Date.now() - first.getTime()) / (7 * 86400000)));
}

