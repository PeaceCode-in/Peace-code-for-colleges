import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, PageTitle, Card, Chip, EventCard, GhostBtn, EmptyState } from "@/components/events/primitives";
import { events, eventById } from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;

type Mode = "day" | "week" | "month" | "agenda";

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 sun
  const diff = (day + 6) % 7; // week starts Monday
  const nd = new Date(d); nd.setDate(d.getDate() - diff); nd.setHours(0, 0, 0, 0);
  return nd;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function CalendarPage() {
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  const byDay = useMemo(() => {
    const map: Record<string, string[]> = {};
    events.forEach((e) => {
      const k = new Date(e.date).toDateString();
      map[k] = map[k] ?? [];
      map[k].push(e.id);
    });
    return map;
  }, []);

  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const startPad = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const monthLabel = anchor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const step = (dir: -1 | 1) => {
    const d = new Date(anchor);
    if (mode === "day") d.setDate(d.getDate() + dir);
    else if (mode === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  };

  const dayEvents = (d: Date) => (byDay[d.toDateString()] ?? []).map(eventById).filter(Boolean);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

  const agendaList = useMemo(() => events
    .filter((e) => new Date(e.date).getTime() >= today.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [today]);

  return (
    <Page wide>
      <PageTitle
        eyebrow="Calendar"
        title="Your quiet planner."
        sub="Every RSVP and campus event, laid out by day, week, or month."
        right={
          <div className="flex items-center gap-2">
            <GhostBtn onClick={() => alert("Google Calendar sync is a placeholder in this build.")}>
              <ExternalLink className="w-3.5 h-3.5"/> Google Calendar (placeholder)
            </GhostBtn>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface2, color: ink, border: `1px solid ${border}` }} aria-label="Previous"><ChevronLeft className="w-4 h-4"/></button>
            <button onClick={() => setAnchor(new Date())} className="text-[12px] rounded-full h-9 px-3 mx-1" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Today</button>
            <button onClick={() => step(1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface2, color: ink, border: `1px solid ${border}` }} aria-label="Next"><ChevronRight className="w-4 h-4"/></button>
            <div className="ml-3 font-serif text-[18px]" style={{ color: ink }}>{monthLabel}</div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["day", "week", "month", "agenda"] as const).map((m) => (
              <Chip key={m} active={mode === m} onClick={() => setMode(m)}>{m[0].toUpperCase() + m.slice(1)}</Chip>
            ))}
          </div>
        </div>

        {/* Month view */}
        {mode === "month" && (
          <div className="mt-5">
            <div className="grid grid-cols-7 text-[10.5px] uppercase tracking-wide mb-2" style={{ color: muted }}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="px-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(anchor.getFullYear(), anchor.getMonth(), i + 1);
                const isToday = sameDay(d, today);
                const evs = dayEvents(d);
                return (
                  <button key={i} onClick={() => { setAnchor(d); setMode("day"); }}
                    className="rounded-2xl p-2 min-h-[76px] text-left transition hover:-translate-y-[1px]"
                    style={{
                      background: evs.length ? soft : surface2,
                      border: `1px solid ${isToday ? primary : border}`,
                      color: ink,
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-[14px]">{i + 1}</span>
                      {isToday && <span className="text-[9px] tracking-widest uppercase" style={{ color: primary }}>today</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {evs.slice(0, 3).map((e, k) => <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: e!.bannerHue }}/>)}
                      {evs.length > 3 && <span className="text-[9.5px]" style={{ color: muted }}>+{evs.length - 3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Week view */}
        {mode === "week" && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-7 gap-2">
            {weekDays.map((d, i) => {
              const evs = dayEvents(d);
              const isToday = sameDay(d, today);
              return (
                <div key={i} className="rounded-2xl p-3" style={{ background: surface2, border: `1px solid ${isToday ? primary : border}` }}>
                  <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>{d.toLocaleString(undefined, { weekday: "short" })}</div>
                  <div className="font-serif text-[18px] mt-0.5" style={{ color: ink }}>{d.getDate()} {d.toLocaleString(undefined, { month: "short" })}</div>
                  <div className="mt-2 space-y-1.5">
                    {evs.length === 0 && <div className="text-[11px]" style={{ color: muted }}>Nothing scheduled</div>}
                    {evs.map((e) => (
                      <Link key={e!.id} to="/events/$id" params={{ id: e!.id }}
                        className="block rounded-xl p-2 text-[11.5px] transition hover:-translate-y-[1px]"
                        style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: e!.bannerHue }}/>
                          <span className="truncate">{new Date(e!.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="font-serif truncate mt-0.5">{e!.title}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Day view */}
        {mode === "day" && (
          <div className="mt-5">
            <div className="font-serif text-[20px] mb-3" style={{ color: ink }}>
              {anchor.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {dayEvents(anchor).length === 0 ? (
              <EmptyState title="Nothing on this day" sub="Explore the week's events instead." />
            ) : (
              <div className="grid gap-3">
                {dayEvents(anchor).map((e) => <EventCard key={e!.id} e={e!} layout="row" />)}
              </div>
            )}
          </div>
        )}

        {/* Agenda */}
        {mode === "agenda" && (
          <div className="mt-5">
            {agendaList.length === 0 ? <EmptyState title="No upcoming events"/> : (
              <div className="grid gap-3">
                {agendaList.map((e) => (
                  <Link key={e.id} to="/events/$id" params={{ id: e.id }}
                    className="flex items-center gap-4 rounded-[22px] p-3 pr-4 transition hover:-translate-y-[1px]"
                    style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                    <div className="w-14 text-center">
                      <div className="text-[10.5px] tracking-widest uppercase" style={{ color: muted }}>{new Date(e.date).toLocaleString(undefined, { month: "short" })}</div>
                      <div className="font-serif text-[20px]">{new Date(e.date).getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-[15.5px] truncate">{e.title}</div>
                      <div className="text-[11.5px] flex items-center gap-2" style={{ color: muted }}>
                        <Clock className="w-3 h-3"/> {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {e.location}
                      </div>
                    </div>
                    <span className="w-2 h-8 rounded-full" style={{ background: e.bannerHue }}/>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="text-[12px]" style={{ color: muted }}>
        <Link to="/events" style={{ color: primary }}>← Back to events home</Link>
        <span className="mx-2">·</span>
        <Link to="/events/my" style={{ color: primary }}>My events</Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/calendar")({ component: CalendarPage });
