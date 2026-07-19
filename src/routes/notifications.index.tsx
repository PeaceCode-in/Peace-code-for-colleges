// Notification Center — Home / overview.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import {
  loadAll, markAllRead, type Notif, CATEGORY_META, type NotifCategory, timeAgo,
} from "@/lib/notifications-store";
import { Icon, NotifRow, SectionLabel, Panel, Pill, PriorityDot } from "@/components/notifications/primitives";
import { currentDisplayName } from "@/lib/auth-store";

const { surface, surface2, border, ink, muted, primary, soft } = palette;

export const Route = createFileRoute("/notifications/")({
  component: NotificationsHome,
});

function useNotifs(): [Notif[], () => void] {
  const [tick, setTick] = useState(0);
  const list = useMemo(() => loadAll().sort((a, b) => b.ts - a.ts), [tick]);
  return [list, () => setTick((t) => t + 1)];
}

function NotificationsHome() {
  const [q, setQ] = useState("");
  const [list, refresh] = useNotifs();
  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("focus", on);
    return () => window.removeEventListener("focus", on);
  }, [refresh]);

  const active = list.filter((n) => !n.archived);
  const unread = active.filter((n) => !n.read);
  const today = active.filter((n) => new Date(n.ts).toDateString() === new Date().toDateString());
  const important = active.filter((n) => n.priority === "critical" || n.priority === "high");
  const pinned = active.filter((n) => n.pinned);
  const recent = active.slice(0, 8);

  const categoryCounts = useMemo(() => {
    const m = new Map<NotifCategory, number>();
    for (const n of active) m.set(n.category, (m.get(n.category) ?? 0) + (n.read ? 0 : 1));
    return m;
  }, [active]);

  const filtered = q.trim()
    ? active.filter((n) => (n.title + " " + n.body + " " + n.type).toLowerCase().includes(q.toLowerCase()))
    : null;

  // AI-style morning summary (deterministic, from current data)
  const summary = useMemo(() => {
    const bits: { label: string; to: string }[] = [];
    const nextAppt = active.find((n) => n.category === "counselling" && n.priority === "high" && !n.read);
    if (nextAppt) bits.push({ label: `one ${nextAppt.type.toLowerCase()}`, to: nextAppt.to || "/counselling" });
    const buddy = active.find((n) => n.category === "buddy" && !n.read);
    if (buddy) bits.push({ label: "one unread Peace Buddy reply", to: buddy.to || "/buddies" });
    const breathe = active.find((n) => n.category === "reminders" && !n.read);
    if (breathe) bits.push({ label: "today's breathing reminder", to: breathe.to || "/breathe" });
    const rec = active.filter((n) => n.category === "resources" && !n.read).length;
    if (rec > 0) bits.push({ label: `${rec} recommended resource${rec > 1 ? "s" : ""}`, to: "/resources" });
    const gym = active.find((n) => n.category === "mindgym" && !n.read);
    if (gym) bits.push({ label: "a Mind Gym challenge", to: gym.to || "/mindgym" });
    return bits.slice(0, 5);
  }, [active]);

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Masthead */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>Inbox</div>
          <h1 className="font-serif text-[28px] sm:text-[36px] leading-tight mt-1">A quiet look at your week.</h1>
          <p className="text-[13px] mt-1.5" style={{ color: muted }}>
            {unread.length === 0 ? "You're all caught up. Nothing waiting on your attention." : `${unread.length} unread · ${today.length} today`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill to="/notifications/history"><Icon name="Clock" className="w-3.5 h-3.5" /> History</Pill>
          <Pill to="/notifications/bookmarks"><Icon name="Bookmark" className="w-3.5 h-3.5" /> Bookmarks</Pill>
          <Pill to="/notifications/archive"><Icon name="Archive" className="w-3.5 h-3.5" /> Archive</Pill>
          <Pill to="/notifications/settings"><Icon name="Settings" className="w-3.5 h-3.5" /> Settings</Pill>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6 flex items-center gap-2 rounded-2xl px-3.5 h-11 sm:h-12"
           style={{ background: surface, border: `1px solid ${border}` }}>
        <Icon name="Search" className="w-4 h-4 opacity-50" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search your notifications by keyword, person, or category…"
          className="flex-1 bg-transparent outline-none text-[13.5px]"
          style={{ color: ink }}
        />
        {q && (
          <button onClick={() => setQ("")} className="text-[11px]" style={{ color: muted }}>clear</button>
        )}
      </div>

      {filtered ? (
        <div className="mt-6">
          <SectionLabel count={filtered.length}>Results for "{q}"</SectionLabel>
          {filtered.length === 0 ? (
            <Panel><div className="text-[13px] text-center" style={{ color: muted }}>Nothing matched. Try a different word.</div></Panel>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.slice(0, 20).map((n) => <NotifRow key={n.id} n={n} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top row: unread + today + morning summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Panel className="md:col-span-1">
              <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Unread</div>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="font-serif text-[46px] leading-none">{unread.length}</div>
                <div className="text-[12px]" style={{ color: muted }}>waiting</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/notifications/inbox" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px]"
                      style={{ background: ink, color: "var(--pc-bg)" }}>
                  <Icon name="Inbox" className="w-3.5 h-3.5" /> Open full inbox
                </Link>
                {unread.length > 0 && (
                  <button onClick={() => { markAllRead(); refresh(); }} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px]"
                          style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                    <Icon name="CheckCheck" className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
            </Panel>

            <Panel className="md:col-span-1">
              <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Today's activity</div>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="font-serif text-[46px] leading-none">{today.length}</div>
                <div className="text-[12px]" style={{ color: muted }}>things happened</div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {Array.from(categoryCounts.entries()).slice(0, 6).map(([cat, count]) => (
                  <Link key={cat} to="/notifications/inbox"
                        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[10.5px]"
                        style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>
                    <Icon name={CATEGORY_META[cat].icon} className="w-3 h-3" />
                    {CATEGORY_META[cat].label}
                    {count > 0 && <span className="ml-0.5" style={{ color: primary }}>· {count}</span>}
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel className="md:col-span-1" >
              <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Good morning, {currentDisplayName().first}</div>
              <div className="font-serif text-[18px] mt-2 leading-snug" style={{ color: ink }}>Here's what today holds.</div>
              {summary.length === 0 ? (
                <p className="text-[13px] mt-2" style={{ color: muted }}>Nothing pressing — a good day to breathe slow.</p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-[13px]" style={{ color: ink }}>
                  {summary.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: primary }} />
                      <Link to={s.to} className="hover:underline underline-offset-4">{s.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/notifications/inbox" className="inline-flex items-center gap-1.5 mt-4 text-[12px]" style={{ color: primary }}>
                View all <Icon name="ArrowRight" className="w-3.5 h-3.5" />
              </Link>
            </Panel>
          </div>

          {/* Pinned */}
          {pinned.length > 0 && (
            <>
              <SectionLabel count={pinned.length}><span className="mr-1">📌</span>Pinned</SectionLabel>
              <div className="flex flex-col gap-2">
                {pinned.map((n) => <NotifRow key={n.id} n={n} />)}
              </div>
            </>
          )}

          {/* Important */}
          {important.length > 0 && (
            <>
              <SectionLabel count={important.length}>Needs your attention</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {important.slice(0, 4).map((n) => (
                  <Link key={n.id} to="/notifications/$id" params={{ id: n.id }}
                        className="group p-4 rounded-2xl transition hover:-translate-y-[1px]"
                        style={{ background: surface, border: `1px solid ${border}` }}>
                    <div className="flex items-center justify-between">
                      <PriorityDot p={n.priority} />
                      <span className="text-[10.5px]" style={{ color: muted }}>{timeAgo(n.ts)}</span>
                    </div>
                    <div className="mt-2 text-[14px] font-medium leading-snug" style={{ color: ink }}>{n.title}</div>
                    <div className="mt-1 text-[12.5px] line-clamp-2" style={{ color: muted }}>{n.body}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11.5px] group-hover:underline underline-offset-4" style={{ color: primary }}>Open →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Recent */}
          <SectionLabel count={recent.length}>Recent</SectionLabel>
          {recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((n) => <NotifRow key={n.id} n={n} />)}
            </div>
          )}

          {/* Categories */}
          <SectionLabel>Browse by category</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_META) as NotifCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const count = active.filter((n) => n.category === cat).length;
              return (
                <Link key={cat} to="/notifications/inbox"
                      className="p-3.5 rounded-2xl flex items-center gap-3 transition hover:-translate-y-[1px]"
                      style={{ background: surface, border: `1px solid ${border}` }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: soft }}>
                    <Icon name={meta.icon} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] truncate" style={{ color: ink }}>{meta.label}</div>
                    <div className="text-[10.5px]" style={{ color: muted }}>{count} {count === 1 ? "item" : "items"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Panel className="mt-2">
      <div className="flex flex-col items-center text-center py-6">
        <svg viewBox="0 0 120 120" width="96" height="96" aria-hidden>
          <defs>
            <radialGradient id="ng" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="var(--pc-soft)" />
              <stop offset="1" stopColor="var(--pc-surface)" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill="url(#ng)" />
          <path d="M40 68q20 -16 40 0" stroke="var(--pc-ink)" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity=".55"/>
          <circle cx="48" cy="54" r="1.6" fill="var(--pc-ink)" opacity=".55"/>
          <circle cx="72" cy="54" r="1.6" fill="var(--pc-ink)" opacity=".55"/>
        </svg>
        <div className="font-serif text-[18px] mt-3" style={{ color: ink }}>You're all caught up.</div>
        <div className="text-[12.5px] mt-1" style={{ color: muted }}>Take a slow breath, then pick something small.</div>
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <Pill to="/journal"><Icon name="PenLine" className="w-3.5 h-3.5" /> Start journal</Pill>
          <Pill to="/resources"><Icon name="BookOpen" className="w-3.5 h-3.5" /> Read a resource</Pill>
          <Pill to="/mindgym"><Icon name="Brain" className="w-3.5 h-3.5" /> Mind Gym</Pill>
          <Pill to="/breathe"><Icon name="Wind" className="w-3.5 h-3.5" /> Breathe</Pill>
        </div>
      </div>
    </Panel>
  );
}
