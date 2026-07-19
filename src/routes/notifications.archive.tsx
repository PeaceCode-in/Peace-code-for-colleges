// Archived notifications — restore or delete forever.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import { loadAll, patch, remove, timeAgo, CATEGORY_META } from "@/lib/notifications-store";
import { Icon, Panel, Pill, CategoryChip } from "@/components/notifications/primitives";

const { surface, border, ink, muted, primary, soft } = palette;

export const Route = createFileRoute("/notifications/archive")({
  component: Archive,
});

function Archive() {
  const [tick, setTick] = useState(0);
  const list = useMemo(() => loadAll().filter((n) => n.archived).sort((a, b) => b.ts - a.ts), [tick]);
  const refresh = () => setTick((t) => t + 1);

  const clearAll = () => {
    if (list.length === 0) return;
    if (!confirm("Delete all archived notifications forever?")) return;
    for (const n of list) remove(n.id);
    refresh();
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>
        <Link to="/notifications" className="hover:underline underline-offset-4">Inbox</Link> · Archive
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap mt-1">
        <h1 className="font-serif text-[26px] sm:text-[32px] leading-tight">Archived</h1>
        <div className="flex gap-2">
          <Pill to="/notifications/inbox"><Icon name="Inbox" className="w-3.5 h-3.5" /> Inbox</Pill>
          <Pill onClick={clearAll}><Icon name="Trash2" className="w-3.5 h-3.5" /> Empty archive</Pill>
        </div>
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <Panel>
            <div className="text-center py-6">
              <Icon name="Archive" className="w-6 h-6 mx-auto opacity-40" />
              <div className="font-serif text-[16px] mt-2">Archive is empty</div>
              <div className="text-[12.5px] mt-1" style={{ color: muted }}>Archived notifications appear here.</div>
              <Link to="/notifications/inbox" className="inline-block mt-3 text-[12px]" style={{ color: primary }}>Go to inbox →</Link>
            </div>
          </Panel>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((n) => (
              <div key={n.id} className="p-3.5 rounded-2xl flex gap-3"
                   style={{ background: surface, border: `1px solid ${border}` }}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: soft }}>
                  <Icon name={n.icon || CATEGORY_META[n.category].icon} className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] truncate" style={{ color: ink }}>{n.title}</div>
                  <div className="text-[12.5px] mt-0.5 line-clamp-2" style={{ color: muted }}>{n.body}</div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <CategoryChip category={n.category} />
                    <span className="text-[10.5px]" style={{ color: muted }}>{timeAgo(n.ts)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => { patch(n.id, { archived: false }); refresh(); }}
                          className="h-8 px-3 rounded-full text-[11.5px]"
                          style={{ background: "var(--pc-surface2)", color: ink, border: `1px solid ${border}` }}>
                    Restore
                  </button>
                  <button onClick={() => { remove(n.id); refresh(); }}
                          className="h-8 px-3 rounded-full text-[11.5px]"
                          style={{ background: "#e35d5d", color: "white" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
