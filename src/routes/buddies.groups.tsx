import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { GROUPS, EVENTS } from "@/lib/buddies-store";
import { ArrowLeft, Users, Calendar, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/buddies/groups")({
  head: () => ({ meta: [{ title: "Peer groups & events" }] }),
  component: Groups,
});

function Groups() {
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;
  const [tab, setTab] = useState<"groups"|"events">("groups");
  const [joined, setJoined] = useState<string[]>([]);
  const [rsvp, setRsvp] = useState<string[]>([]);

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-1" style={{ color: ink }}>Peer groups</h1>
        <p className="text-[13px] mb-6" style={{ color: muted }}>Small, safe rooms of students moving through similar stuff.</p>

        <div className="inline-flex rounded-full p-1 mb-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <button onClick={()=>setTab("groups")} className="px-5 py-1.5 rounded-full text-[12px]" style={{ background: tab==="groups" ? ink : "transparent", color: tab==="groups" ? surface : muted }}>Groups</button>
          <button onClick={()=>setTab("events")} className="px-5 py-1.5 rounded-full text-[12px]" style={{ background: tab==="events" ? ink : "transparent", color: tab==="events" ? surface : muted }}>Events</button>
        </div>

        {tab === "groups" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GROUPS.map((g) => {
              const isIn = joined.includes(g.id);
              return (
                <div key={g.id} className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(120deg, ${soft}, ${lavender})` }}>
                    <Users className="w-5 h-5" style={{ color: primary }}/>
                  </div>
                  <div><div className="font-serif text-[17px]" style={{ color: ink }}>{g.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: muted }}>{g.desc}</div></div>
                  <div className="flex items-center justify-between text-[10.5px]" style={{ color: muted }}>
                    <span>{g.members} members</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: surface2 }}>{g.tag}</span>
                  </div>
                  <button onClick={()=>setJoined(isIn ? joined.filter(x=>x!==g.id) : [...joined, g.id])}
                    className="py-2 rounded-full text-[12px]" style={{ background: isIn ? surface2 : ink, color: isIn ? ink : surface }}>
                    {isIn ? "leave group" : "join group"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {EVENTS.map((e) => {
              const going = rsvp.includes(e.id);
              return (
                <div key={e.id} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: soft }}>
                    <Calendar className="w-5 h-5" style={{ color: primary }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[15px]" style={{ color: ink }}>{e.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: muted }}>{e.when} · hosted by {e.host}</div>
                  </div>
                  <button onClick={()=>setRsvp(going ? rsvp.filter(x=>x!==e.id) : [...rsvp, e.id])}
                    className="px-4 py-2 rounded-full text-[11px] shrink-0" style={{ background: going ? surface2 : ink, color: going ? ink : surface }}>
                    {going ? "going ✓" : "RSVP"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-3xl p-6 mt-10 flex items-center justify-between" style={{ background: surface, border: `1px solid ${border}` }}>
          <div><div className="font-serif text-[17px]" style={{ color: ink }}>Need 1-on-1 instead?</div>
            <div className="text-[11px]" style={{ color: muted }}>Groups are lovely — but a private conversation might fit better today.</div></div>
          <Link to="/buddies/browse" className="px-4 py-2 rounded-full text-[12px] flex items-center gap-1.5" style={{ background: ink, color: surface }}>Find buddy <ArrowRight className="w-3 h-3"/></Link>
        </div>
      </main>
    </AppShell>
  );
}
