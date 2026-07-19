import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { myCounsellors, photoFor, listAppointments, listMessages, listDocs } from "@/lib/counselling-store";
import { CalendarClock, MessageCircle, FileText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/counselling/my")({
  component: MyCounsellors,
});

function MyCounsellors() {
  const { ink, muted, surface2, border } = palette;
  const list = myCounsellors();
  const appts = listAppointments();

  if (list.length === 0) {
    return (
      <Card className="text-center py-16">
        <div className="font-serif text-[22px] mb-1" style={{ color: ink }}>You haven't met a counsellor yet.</div>
        <p className="text-[13.5px] mb-4" style={{ color: muted }}>When you do, they'll show up here with your session history and shared documents.</p>
        <Link to="/counselling/experts" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>Find a counsellor <ArrowRight className="w-4 h-4" /></Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map(e => {
        const mine = appts.filter(a => a.expertId === e.id);
        const done = mine.filter(a => a.status === "completed").length;
        const upcoming = mine.find(a => a.scheduledFor > Date.now() && a.status === "confirmed");
        const msgs = listMessages(e.id).length;
        const docs = listDocs().filter(d => (d.sharedWith ?? []).includes(e.id)).length;
        return (
          <Card key={e.id}>
            <div className="flex items-start gap-3">
              <img src={photoFor(e.id)} alt="" className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} />
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[18px] truncate" style={{ color: ink }}>{e.name}</div>
                <div className="text-[12.5px]" style={{ color: muted }}>{e.title}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {e.specializations.slice(0, 3).map(s => <Chip key={s}>{s}</Chip>)}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Sessions" value={done} />
              <Stat label="Messages" value={msgs} />
              <Stat label="Documents" value={docs} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/counselling/expert/$id" params={{ id: e.id }} className="rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Profile</Link>
              <Link to="/counselling/book/$id" params={{ id: e.id }} className="rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: ink, color: "#fff" }}>Book again</Link>
              <Link to="/counselling/messages" className="rounded-full px-3 py-1.5 text-[12.5px] inline-flex items-center gap-1" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}><MessageCircle className="w-3.5 h-3.5" /> Message</Link>
              {upcoming && (
                <Link to="/counselling/appt/$aid" params={{ aid: upcoming.id }} className="rounded-full px-3 py-1.5 text-[12.5px] inline-flex items-center gap-1" style={{ background: "#eaf6ea", color: "#2f6a37" }}><CalendarClock className="w-3.5 h-3.5" /> Upcoming session</Link>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { ink, muted, surface2 } = palette;
  return (
    <div className="rounded-2xl py-2" style={{ background: surface2 }}>
      <div className="font-serif text-[19px]" style={{ color: ink }}>{value}</div>
      <div className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: muted }}>{label}</div>
    </div>
  );
}
