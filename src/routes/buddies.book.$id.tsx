import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { getBuddy, avatarFor, createSession, parseSlot } from "@/lib/buddies-store";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/buddies/book/$id")({
  component: Book,
});

function Book() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const b = getBuddy(id);
  const { surface, surface2, border, ink, muted } = palette;

  const [day, setDay] = useState<string>("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState<"online"|"offline">("online");

  if (!b) return <AppShell><main className="p-10 text-center">Buddy not found.</main></AppShell>;

  const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const today = new Date();
  const upcoming = dayLabels.map((d, i) => {
    const date = new Date(today); date.setDate(today.getDate() + i);
    return { day: d, label: i===0 ? "Today" : i===1 ? "Tomorrow" : date.toLocaleDateString([], { weekday: "short", day: "numeric" }), slots: b.weekly[d] ?? [], date };
  });

  const ready = day && time && topic && language;

  const book = () => {
    const selectedDay = upcoming.find(u => u.day === day);
    const p = parseSlot(time);
    let scheduledFor: number | undefined;
    if (selectedDay && p) {
      const when = new Date(selectedDay.date); when.setHours(p.h, p.m, 0, 0);
      scheduledFor = when.getTime();
    }
    const slotLabel = selectedDay ? `${selectedDay.label} · ${time}` : time;
    const s = createSession({ buddyId: id, status: "waiting", scheduledFor, slotLabel, duration, topic, language, goal: mode === "offline" ? "Campus meetup" : undefined });
    navigate({ to: "/buddies/request/$id", params: { id: s.id } });
  };

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies/$id" params={{ id }} className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back to profile
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <img src={avatarFor(b.id)} className="w-14 h-14 rounded-2xl" alt=""/>
          <div><div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>book a session with</div>
            <div className="font-serif text-[19px]" style={{ color: ink }}>{b.name}</div></div>
        </div>

        <h1 className="font-serif text-[clamp(1.6rem,3vw,2rem)] leading-tight mb-2" style={{ color: ink }}>Pick a time that feels right</h1>
        <p className="text-[13px] mb-8" style={{ color: muted }}>Sessions are private, gentle, and you can always cancel.</p>

        {/* Day */}
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: muted }}>Choose day</div>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {upcoming.map((u) => {
              const disabled = u.slots.length === 0;
              const active = day === u.day;
              return <button key={u.day} disabled={disabled} onClick={()=>{ setDay(u.day); setTime(""); }}
                className="rounded-2xl p-3 text-center transition"
                style={{ background: active ? ink : surface, color: active ? surface : (disabled ? muted : ink), border: `1px solid ${border}`, opacity: disabled ? 0.4 : 1 }}>
                <div className="text-[9px] uppercase tracking-[0.2em] opacity-70">{u.label}</div>
                <div className="text-[13px] font-serif mt-0.5">{u.day}</div>
                <div className="text-[9px] mt-1 opacity-60">{u.slots.length} slots</div>
              </button>;
            })}
          </div>
        </div>

        {/* Time slots */}
        {day && (
          <div className="mb-6">
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: muted }}>Available times</div>
            <div className="flex flex-wrap gap-2">
              {(upcoming.find(u=>u.day===day)?.slots ?? []).map((t) => (
                <button key={t} onClick={()=>setTime(t)}
                  className="px-4 py-2 rounded-full text-[12px]"
                  style={{ background: time===t ? ink : surface, color: time===t ? surface : ink, border: `1px solid ${border}` }}>{t}</button>
              ))}
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: muted }}>Duration</div>
          <div className="flex gap-2">
            {[15,30,45,60].map((d) => (
              <button key={d} onClick={()=>setDuration(d)}
                className="px-4 py-2 rounded-full text-[12px]"
                style={{ background: duration===d ? ink : surface, color: duration===d ? surface : ink, border: `1px solid ${border}` }}>{d} min</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: muted }}>Topic</div>
            <select value={topic} onChange={(e)=>setTopic(e.target.value)} className="w-full text-[13px] px-4 py-3 rounded-2xl outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
              <option value="">choose one…</option>
              {b.topics.map((t)=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: muted }}>Language</div>
            <select value={language} onChange={(e)=>setLanguage(e.target.value)} className="w-full text-[13px] px-4 py-3 rounded-2xl outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
              <option value="">choose one…</option>
              {b.languages.map((l)=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: muted }}>Mode</div>
          <div className="flex gap-2">
            <button onClick={()=>setMode("online")} className="flex-1 py-3 rounded-2xl text-[12.5px]"
              style={{ background: mode==="online" ? ink : surface, color: mode==="online" ? surface : ink, border: `1px solid ${border}` }}>Online chat</button>
            <button onClick={()=>setMode("offline")} className="flex-1 py-3 rounded-2xl text-[12.5px]"
              style={{ background: mode==="offline" ? ink : surface, color: mode==="offline" ? surface : ink, border: `1px solid ${border}` }}>Campus meetup</button>
          </div>
        </div>

        <button disabled={!ready} onClick={book}
          className="w-full px-5 py-3.5 rounded-full text-[13px] flex items-center justify-center gap-2"
          style={{ background: ready ? ink : surface2, color: ready ? surface : muted, opacity: ready ? 1 : 0.6 }}>
          <Calendar className="w-4 h-4"/> Confirm & send request <ArrowRight className="w-3.5 h-3.5"/>
        </button>
      </main>
    </AppShell>
  );
}
