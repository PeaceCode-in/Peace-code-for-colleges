import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip, fmtDay, fmtTime, rupee } from "./counselling";
import { upcomingAppointments, getExpert, photoFor } from "@/lib/counselling-store";
import { CalendarClock, ArrowRight, Video, Phone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/counselling/upcoming")({
  component: Upcoming,
});

function Upcoming() {
  const { ink, muted, surface, surface2, border } = palette;
  const items = upcomingAppointments();

  if (items.length === 0) {
    return (
      <Card className="text-center py-16">
        <div className="font-serif text-[22px] mb-1" style={{ color: ink }}>No upcoming sessions.</div>
        <p className="text-[13.5px] mb-4" style={{ color: muted }}>Care goes further with consistency. When you're ready:</p>
        <Link to="/counselling/experts" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>Book a session <ArrowRight className="w-4 h-4" /></Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(a => {
        const e = getExpert(a.expertId); if (!e) return null;
        const M = a.mode === "video" ? Video : a.mode === "audio" ? Phone : MessageSquare;
        const ms = a.scheduledFor - Date.now();
        const canJoin = ms < 10 * 60_000 && ms > -60 * 60_000;
        return (
          <Card key={a.id}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img src={photoFor(e.id)} alt="" className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} />
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[18px] truncate" style={{ color: ink }}>{e.name}</div>
                <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: muted }}>
                  <CalendarClock className="w-3.5 h-3.5" /> {fmtDay(a.scheduledFor)} · {fmtTime(a.scheduledFor)} · {a.duration} min
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Chip><M className="w-3 h-3 mr-0.5 inline" /> {a.mode}</Chip>
                  <Chip>{a.language}</Chip>
                  <Chip tone={a.paid ? "success" : "warn"}>{a.paid ? "Paid" : "Unpaid"} · {rupee(a.fee)}</Chip>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Link to="/counselling/appt/$aid" params={{ aid: a.id }} className="rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>Details</Link>
                {canJoin && <Link to="/counselling/session/$aid" params={{ aid: a.id }} className="rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: ink, color: "#fff" }}>Join</Link>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
