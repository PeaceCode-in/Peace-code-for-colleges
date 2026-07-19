import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import { Card, Chip, fmtDay, fmtTime, rupee } from "./counselling";
import { listAppointments, getExpert, photoFor } from "@/lib/counselling-store";

export const Route = createFileRoute("/counselling/history")({
  component: History,
});

function History() {
  const { ink, muted, surface, surface2, border } = palette;
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled" | "missed">("all");

  const items = useMemo(() => {
    const all = listAppointments();
    const past = all.filter(a => a.scheduledFor <= Date.now() || a.status === "completed" || a.status === "cancelled" || a.status === "missed");
    return past
      .filter(a => filter === "all" ? true : a.status === filter)
      .sort((a, b) => b.scheduledFor - a.scheduledFor);
  }, [filter]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>History</div>
          <h1 className="font-serif text-[26px]" style={{ color: ink }}>Your care so far</h1>
        </div>
        <div className="flex gap-1.5">
          <Chip active={view === "timeline"} onClick={() => setView("timeline")}>Timeline</Chip>
          <Chip active={view === "calendar"} onClick={() => setView("calendar")}>Calendar</Chip>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(["all","completed","cancelled","missed"] as const).map(f => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="text-center py-14">
          <div className="font-serif text-[20px] mb-1" style={{ color: ink }}>No past sessions yet.</div>
          <Link to="/counselling/experts" className="text-[13px] underline underline-offset-2" style={{ color: muted }}>Find someone to start with</Link>
        </Card>
      )}

      {view === "timeline" && (
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-4 w-px" style={{ background: border }} />
          <div className="space-y-3">
            {items.map(a => {
              const e = getExpert(a.expertId);
              return (
                <div key={a.id} className="relative pl-10">
                  <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full" style={{ background: a.status === "completed" ? "#2f6a37" : a.status === "cancelled" ? "#c14a5a" : "#c99a2a" }} />
                  <Card>
                    <div className="flex items-center gap-3">
                      {e && <img src={photoFor(e.id)} alt="" className="w-10 h-10 rounded-2xl" style={{ background: surface2 }} />}
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-[16px] truncate" style={{ color: ink }}>{e?.name ?? "Session"}</div>
                        <div className="text-[12.5px]" style={{ color: muted }}>{fmtDay(a.scheduledFor)} · {fmtTime(a.scheduledFor)} · {a.duration} min · {a.mode}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Chip tone={a.status === "completed" ? "success" : a.status === "cancelled" ? "warn" : "info"}>{a.status}</Chip>
                          {a.moodBefore && <Chip>before: {a.moodBefore}</Chip>}
                          {a.moodAfter && <Chip>after: {a.moodAfter}</Chip>}
                          <Chip>{rupee(a.fee)}</Chip>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {a.status === "completed" && (
                          <Link to="/counselling/summary/$aid" params={{ aid: a.id }} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: ink, color: "#fff" }}>Summary</Link>
                        )}
                        {e && <Link to="/counselling/book/$id" params={{ id: e.id }} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>Book again</Link>}
                      </div>
                    </div>
                    {a.reason && <p className="mt-2 text-[13px]" style={{ color: muted }}>{a.reason}</p>}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "calendar" && (
        <CalendarView items={items} />
      )}
    </>
  );
}

function CalendarView({ items }: { items: ReturnType<typeof listAppointments> }) {
  const { ink, muted, surface2, border, primary } = palette;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const byDate = new Map<number, number>();
  items.forEach(a => {
    const dt = new Date(a.scheduledFor);
    if (dt.getFullYear() === y && dt.getMonth() === m) byDate.set(dt.getDate(), (byDate.get(dt.getDate()) ?? 0) + 1);
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="font-serif text-[17px]" style={{ color: ink }}>{first.toLocaleDateString([], { month: "long", year: "numeric" })}</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[11px] mb-1" style={{ color: muted }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <div key={i} className="aspect-square rounded-xl flex flex-col items-center justify-center text-[12px]" style={{ background: c && byDate.get(c) ? primary : surface2, color: c && byDate.get(c) ? "#fff" : ink, border: `1px solid ${border}`, opacity: c ? 1 : 0 }}>
            {c ?? ""}
            {c && byDate.get(c) && <div className="text-[9px] opacity-90">{byDate.get(c)}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}
