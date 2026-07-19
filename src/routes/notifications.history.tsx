// Notification history — timeline, search, filters, export.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import {
  loadAll, saveAll, CATEGORY_META, type NotifCategory,
  BUCKET_LABEL, bucketFor, timeAgo,
} from "@/lib/notifications-store";
import { Icon, Panel, Pill, CategoryChip, SectionLabel } from "@/components/notifications/primitives";

const { surface, border, ink, muted, primary, soft } = palette;

export const Route = createFileRoute("/notifications/history")({
  component: History,
});

function History() {
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<NotifCategory | "all">("all");
  const list = useMemo(() => loadAll().sort((a, b) => b.ts - a.ts), [tick]);
  const refresh = () => setTick((t) => t + 1);

  const filtered = list.filter((n) => {
    if (cat !== "all" && n.category !== cat) return false;
    if (q.trim() && !(n.title + " " + n.body).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const buckets = useMemo(() => {
    const b: Record<string, typeof filtered> = { today: [], yesterday: [], week: [], month: [], older: [] };
    for (const n of filtered) b[bucketFor(n.ts)].push(n);
    return b;
  }, [filtered]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `peacecode-notifications-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearOlder = () => {
    if (!confirm("Delete notifications older than 30 days?")) return;
    const cutoff = Date.now() - 30 * 86_400_000;
    saveAll(loadAll().filter((n) => n.ts >= cutoff));
    refresh();
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>
        <Link to="/notifications" className="hover:underline underline-offset-4">Inbox</Link> · History
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap mt-1">
        <h1 className="font-serif text-[26px] sm:text-[32px] leading-tight">Everything that happened</h1>
        <div className="flex gap-2 flex-wrap">
          <Pill onClick={exportJson}><Icon name="Download" className="w-3.5 h-3.5" /> Export</Pill>
          <Pill onClick={clearOlder}><Icon name="Trash2" className="w-3.5 h-3.5" /> Clear older than 30d</Pill>
          <Pill to="/notifications/settings"><Icon name="Settings" className="w-3.5 h-3.5" /> Settings</Pill>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl px-3.5 h-11"
           style={{ background: surface, border: `1px solid ${border}` }}>
        <Icon name="Search" className="w-4 h-4 opacity-50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search history…"
               className="flex-1 bg-transparent outline-none text-[13.5px]" style={{ color: ink }} />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <Pill active={cat === "all"} onClick={() => setCat("all")}>Everything</Pill>
        {(Object.keys(CATEGORY_META) as NotifCategory[]).map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
            <Icon name={CATEGORY_META[c].icon} className="w-3.5 h-3.5" /> {CATEGORY_META[c].label}
          </Pill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Panel className="mt-6"><div className="text-center py-6 text-[13px]" style={{ color: muted }}>Nothing matches.</div></Panel>
      ) : (
        (["today", "yesterday", "week", "month", "older"] as const).map((k) => {
          const items = buckets[k];
          if (!items.length) return null;
          return (
            <div key={k}>
              <SectionLabel count={items.length}>{BUCKET_LABEL[k]}</SectionLabel>
              <div className="relative pl-4 sm:pl-6">
                <span className="absolute left-1.5 sm:left-2 top-2 bottom-2 w-px" style={{ background: border }} />
                <div className="flex flex-col gap-2">
                  {items.map((n) => (
                    <Link key={n.id} to="/notifications/$id" params={{ id: n.id }}
                          className="relative p-3.5 rounded-2xl transition hover:-translate-y-[1px] flex gap-3"
                          style={{ background: surface, border: `1px solid ${border}` }}>
                      <span className="absolute -left-3.5 sm:-left-[19px] top-6 w-2.5 h-2.5 rounded-full ring-4"
                            style={{ background: soft, boxShadow: `0 0 0 3px var(--pc-bg)` }} />
                      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: soft }}>
                        <Icon name={n.icon || CATEGORY_META[n.category].icon} className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] truncate" style={{ color: ink }}>{n.title}</div>
                        <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>{new Date(n.ts).toLocaleString()} · {timeAgo(n.ts)}</div>
                        <div className="flex items-center gap-2 mt-2"><CategoryChip category={n.category} /></div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
