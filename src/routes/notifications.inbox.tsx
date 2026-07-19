// Full inbox — grouped, filterable, searchable, bulk-actionable.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import {
  loadAll, saveAll, markAllRead, patch, archive, remove,
  CATEGORY_META, type Notif, type NotifCategory,
  BUCKET_LABEL, bucketFor, smartGroup, type Group, timeAgo,
} from "@/lib/notifications-store";
import { Icon, NotifRow, SectionLabel, Panel, Pill, CategoryChip } from "@/components/notifications/primitives";

const { surface, border, ink, muted, primary, soft, surface2 } = palette;

export const Route = createFileRoute("/notifications/inbox")({
  component: Inbox,
});

type Filter =
  | "all" | "unread" | "read" | "pinned" | "bookmarked" | "high"
  | "today" | "week" | "month"
  | "messages" | "system" | "wellness" | "community";

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: "all",        label: "All",         icon: "Inbox" },
  { key: "unread",     label: "Unread",      icon: "Circle" },
  { key: "read",       label: "Read",        icon: "Check" },
  { key: "pinned",     label: "Pinned",      icon: "Pin" },
  { key: "bookmarked", label: "Bookmarked",  icon: "Bookmark" },
  { key: "high",       label: "High priority", icon: "AlertCircle" },
  { key: "today",      label: "Today",       icon: "Calendar" },
  { key: "week",       label: "This week",   icon: "CalendarDays" },
  { key: "month",      label: "This month",  icon: "Calendar" },
  { key: "messages",   label: "Messages",    icon: "MessageSquare" },
  { key: "wellness",   label: "Wellness",    icon: "Heart" },
  { key: "community",  label: "Community",   icon: "Users" },
  { key: "system",     label: "System",      icon: "Settings" },
];

const MESSAGE_CATS: NotifCategory[] = ["peacebot", "buddy", "counselling", "community"];
const WELLNESS_CATS: NotifCategory[] = ["journal", "gratitude", "mindgym", "reminders", "achievements", "resources"];
const SYSTEM_CATS: NotifCategory[] = ["system", "account"];

function Inbox() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const all = useMemo(() => loadAll().sort((a, b) => b.ts - a.ts), [tick]);

  const [filter, setFilter] = useState<Filter>("all");
  const [cat, setCat] = useState<NotifCategory | "all">("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    const now = Date.now();
    const day = 86_400_000;
    return all.filter((n) => {
      if (n.archived) return false;
      if (cat !== "all" && n.category !== cat) return false;
      if (filter === "unread" && n.read) return false;
      if (filter === "read" && !n.read) return false;
      if (filter === "pinned" && !n.pinned) return false;
      if (filter === "bookmarked" && !n.bookmarked) return false;
      if (filter === "high" && n.priority !== "high" && n.priority !== "critical") return false;
      if (filter === "today" && bucketFor(n.ts) !== "today") return false;
      if (filter === "week" && now - n.ts > 7 * day) return false;
      if (filter === "month" && now - n.ts > 30 * day) return false;
      if (filter === "messages" && !MESSAGE_CATS.includes(n.category)) return false;
      if (filter === "wellness" && !WELLNESS_CATS.includes(n.category)) return false;
      if (filter === "community" && n.category !== "community") return false;
      if (filter === "system" && !SYSTEM_CATS.includes(n.category)) return false;
      if (q.trim()) {
        const s = (n.title + " " + n.body + " " + n.type + " " + (n.person?.name || "")).toLowerCase();
        if (!s.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, filter, cat, q]);

  // Bucket + smart-group
  const buckets = useMemo(() => {
    const b: Record<string, Notif[]> = { today: [], yesterday: [], week: [], month: [], older: [] };
    for (const n of list) b[bucketFor(n.ts)].push(n);
    return b;
  }, [list]);

  const toggleSel = (id: string) =>
    setSelected((s) => { const c = new Set(s); c.has(id) ? c.delete(id) : c.add(id); return c; });

  const bulk = (action: "read" | "archive" | "delete" | "pin") => {
    if (selected.size === 0) return;
    const cur = loadAll();
    const next = cur
      .map((n) => selected.has(n.id) && action === "read" ? { ...n, read: true } : n)
      .map((n) => selected.has(n.id) && action === "archive" ? { ...n, archived: true, read: true } : n)
      .map((n) => selected.has(n.id) && action === "pin" ? { ...n, pinned: !n.pinned } : n);
    const final = action === "delete" ? next.filter((n) => !selected.has(n.id)) : next;
    saveAll(final);
    setSelected(new Set());
    refresh();
  };

  const anySelected = selected.size > 0;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>
            <Link to="/notifications" className="hover:underline underline-offset-4">Inbox</Link> · All notifications
          </div>
          <h1 className="font-serif text-[26px] sm:text-[32px] leading-tight mt-1">
            {list.length} notification{list.length === 1 ? "" : "s"}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Pill onClick={() => { markAllRead(); refresh(); }}>
            <Icon name="CheckCheck" className="w-3.5 h-3.5" /> Mark all read
          </Pill>
          <Pill to="/notifications/settings"><Icon name="Settings" className="w-3.5 h-3.5" /> Settings</Pill>
        </div>
      </div>

      {/* Search */}
      <div className="mt-5 flex items-center gap-2 rounded-2xl px-3.5 h-11"
           style={{ background: surface, border: `1px solid ${border}` }}>
        <Icon name="Search" className="w-4 h-4 opacity-50" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="Search…"
               className="flex-1 bg-transparent outline-none text-[13.5px]" style={{ color: ink }} />
        {q && <button onClick={() => setQ("")} className="text-[11px]" style={{ color: muted }}>clear</button>}
      </div>

      {/* Filter row */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <Pill key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            <Icon name={f.icon} className="w-3.5 h-3.5" /> {f.label}
          </Pill>
        ))}
      </div>

      {/* Category row */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <Pill active={cat === "all"} onClick={() => setCat("all")}>Everything</Pill>
        {(Object.keys(CATEGORY_META) as NotifCategory[]).map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
            <Icon name={CATEGORY_META[c].icon} className="w-3.5 h-3.5" /> {CATEGORY_META[c].label}
          </Pill>
        ))}
      </div>

      {/* Bulk bar */}
      {anySelected && (
        <div className="mt-4 flex items-center gap-2 flex-wrap p-3 rounded-2xl"
             style={{ background: surface2, border: `1px solid ${border}` }}>
          <span className="text-[12px]" style={{ color: ink }}>{selected.size} selected</span>
          <button onClick={() => bulk("read")} className="h-8 px-3 rounded-full text-[12px]"
                  style={{ background: surface, border: `1px solid ${border}`, color: ink }}>Mark read</button>
          <button onClick={() => bulk("pin")} className="h-8 px-3 rounded-full text-[12px]"
                  style={{ background: surface, border: `1px solid ${border}`, color: ink }}>Toggle pin</button>
          <button onClick={() => bulk("archive")} className="h-8 px-3 rounded-full text-[12px]"
                  style={{ background: surface, border: `1px solid ${border}`, color: ink }}>Archive</button>
          <button onClick={() => bulk("delete")} className="h-8 px-3 rounded-full text-[12px]"
                  style={{ background: "#e35d5d", color: "white" }}>Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[11.5px]" style={{ color: muted }}>Clear</button>
        </div>
      )}

      {/* Body */}
      {list.length === 0 ? (
        <Panel className="mt-6">
          <div className="text-center py-6">
            <div className="font-serif text-[18px]">Nothing here.</div>
            <div className="text-[12.5px] mt-1" style={{ color: muted }}>Try clearing filters or searching a different word.</div>
          </div>
        </Panel>
      ) : (
        (["today", "yesterday", "week", "month", "older"] as const).map((k) => {
          const items = buckets[k];
          if (!items.length) return null;
          const grouped = smartGroup(items);
          return (
            <div key={k}>
              <SectionLabel count={items.length}>{BUCKET_LABEL[k]}</SectionLabel>
              <div className="flex flex-col gap-2">
                {grouped.map((entry) =>
                  "items" in entry
                    ? <GroupBlock key={entry.key} g={entry} onChange={refresh} />
                    : (
                      <div key={entry.id} className="relative">
                        <label className="absolute -left-1 top-4 z-10 opacity-0 hover:opacity-100 focus-within:opacity-100 group">
                          <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSel(entry.id)}
                                 className="w-3.5 h-3.5 accent-[var(--pc-primary)]" aria-label="Select notification" />
                        </label>
                        <RowWithActions n={entry} onChange={refresh} onSelectToggle={() => toggleSel(entry.id)}
                                        selected={selected.has(entry.id)} />
                      </div>
                    ),
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function RowWithActions({ n, onChange, selected, onSelectToggle }: { n: Notif; onChange: () => void; selected: boolean; onSelectToggle: () => void }) {
  return (
    <div className="relative group">
      <NotifRow n={n} onOpen={() => patch(n.id, { read: true })} />
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={(e) => { e.preventDefault(); onSelectToggle(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: surface, border: `1px solid ${border}`, color: selected ? primary : muted }}
                aria-label="Select">
          <Icon name={selected ? "CheckSquare" : "Square"} className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); patch(n.id, { read: !n.read }); onChange(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: surface, border: `1px solid ${border}`, color: muted }} aria-label="Toggle read">
          <Icon name={n.read ? "Mail" : "MailOpen"} className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); patch(n.id, { pinned: !n.pinned }); onChange(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: surface, border: `1px solid ${border}`, color: n.pinned ? primary : muted }} aria-label="Pin">
          <Icon name="Pin" className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); archive(n.id); onChange(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: surface, border: `1px solid ${border}`, color: muted }} aria-label="Archive">
          <Icon name="Archive" className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); remove(n.id); onChange(); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: surface, border: `1px solid ${border}`, color: muted }} aria-label="Delete">
          <Icon name="Trash2" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function GroupBlock({ g, onChange }: { g: Group; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[g.category];
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
      <button onClick={() => setOpen((x) => !x)} className="w-full flex items-center gap-3 p-3.5 text-left">
        <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: soft }}>
          <Icon name={meta.icon} className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium" style={{ color: ink }}>{g.label}</div>
          <div className="text-[12px] mt-0.5" style={{ color: muted }}>
            {timeAgo(g.from)} – {timeAgo(g.to)} · Tap to expand
          </div>
        </div>
        <CategoryChip category={g.category} />
        <Icon name={open ? "ChevronUp" : "ChevronDown"} className="w-4 h-4 opacity-60 ml-2" />
      </button>
      {open && (
        <div className="border-t px-2 pt-2 pb-2 space-y-1" style={{ borderColor: border }}>
          {g.items.map((n) => (
            <div key={n.id}>
              <Link
                to="/notifications/$id" params={{ id: n.id }}
                onClick={() => { patch(n.id, { read: true }); onChange(); }}
                className="flex items-start gap-3 p-3 rounded-xl transition hover:bg-[var(--pc-surface2)]"
              >
                {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: primary }} />}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] truncate" style={{ color: ink }}>{n.title}</div>
                  <div className="text-[11.5px]" style={{ color: muted }}>{timeAgo(n.ts)}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
