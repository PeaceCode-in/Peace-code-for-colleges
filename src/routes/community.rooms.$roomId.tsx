import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, MicOff, Send, Heart, MoreHorizontal, Volume2 } from "lucide-react";
import { cmy } from "@/lib/community-theme";
import { community, useCommunity, timeAgo } from "@/lib/community-store";

export const Route = createFileRoute("/community/rooms/$roomId")({
  component: RoomDetail,
  loader: ({ params }) => {
    const r = community.getRoom(params.roomId);
    if (!r) throw notFound();
    return { id: params.roomId };
  },
  notFoundComponent: () => (
    <main className="max-w-[720px] mx-auto px-6 py-16 text-center">
      <div className="font-serif text-[26px]">this room has closed.</div>
      <Link to="/community/rooms" className="mt-4 inline-block text-[12px] tracking-[0.24em] uppercase" style={{ color: cmy.primary }}>← back to rooms</Link>
    </main>
  ),
});

function RoomDetail() {
  const { roomId } = Route.useParams();
  const { rooms, roomMessages } = useCommunity();
  const room = rooms.find((r) => r.id === roomId)!;
  const msgs = roomMessages.filter((m) => m.roomId === roomId);

  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  const send = () => {
    if (!input.trim()) return;
    community.sendRoomMessage(roomId, input);
    setInput("");
  };

  return (
    <main className="relative z-10 max-w-[1180px] mx-auto px-5 lg:px-10 pt-6 lg:pt-8 pb-24">
      <Link to="/community/rooms" className="flex items-center gap-2 text-[12px] mb-6" style={{ color: cmy.muted }}>
        <ArrowLeft className="w-4 h-4" strokeWidth={1.6}/> back to rooms
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-10"
                 style={{ background: `linear-gradient(160deg, ${cmy.surface} 0%, ${cmy.surface2} 100%)`, border: `1px solid ${cmy.border}` }}>
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-70"
               style={{ background: `radial-gradient(circle, ${cmy.lavender}, transparent 70%)` }}/>
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full blur-3xl opacity-70"
               style={{ background: `radial-gradient(circle, ${cmy.sky}, transparent 70%)` }}/>

          <div className="relative flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase mb-6" style={{ color: cmy.muted }}>
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#EF6B6B", opacity: 0.6 }}/>
              <span className="relative rounded-full w-2 h-2" style={{ background: "#EF6B6B" }}/>
            </span>
            live · {room.tag} · started {room.started}
          </div>
          <h1 className="relative font-serif text-[clamp(1.8rem,4.5vw,3.2rem)] leading-[1.02] tracking-tight max-w-[620px]">{room.name}</h1>
          <p className="relative mt-4 text-[14px] max-w-[560px]" style={{ color: cmy.muted }}>{room.topic}</p>

          {/* speakers */}
          <div className="relative mt-8 flex flex-wrap items-end gap-5">
            {[
              { name: room.host, role: "host", color: cmy.primary, speaking: true },
              { name: "kavya", role: "co-host", color: cmy.lavender, speaking: false },
              { name: "leaf",   role: "guest",  color: cmy.sky, speaking: true },
              { name: "june",   role: "guest",  color: cmy.mint, speaking: false },
              { name: "moth",   role: "guest",  color: cmy.rose, speaking: false },
            ].map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2">
                <div className="relative">
                  {s.speaking && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: s.color, opacity: 0.35 }}/>}
                  <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-serif text-[17px]"
                        style={{ background: s.color, color: cmy.ink, border: `2px solid ${cmy.surface}`, boxShadow: "0 10px 24px -12px rgba(29,42,68,0.35)" }}>
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-[12px]" style={{ color: cmy.ink }}>{s.name}</div>
                  <div className="text-[9.5px] tracking-[0.22em] uppercase" style={{ color: cmy.muted }}>{s.role}</div>
                </div>
              </div>
            ))}
            <div className="ml-auto text-right">
              <div className="font-serif text-[32px] leading-none" style={{ color: cmy.ink }}>{room.listeners}</div>
              <div className="text-[10px] tracking-[0.28em] uppercase mt-1" style={{ color: cmy.muted }}>listening</div>
            </div>
          </div>

          {/* controls */}
          <div className="relative mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
            <button onClick={() => setMuted(!muted)}
                    className="h-11 sm:h-12 px-4 sm:px-5 rounded-full flex items-center gap-2 text-[12.5px] transition hover:-translate-y-0.5"
                    style={{ background: muted ? cmy.surface : cmy.ink, color: muted ? cmy.ink : "#F7FAFF", border: `1px solid ${cmy.border}` }}>
              {muted ? <MicOff className="w-4 h-4" strokeWidth={1.6}/> : <Mic className="w-4 h-4" strokeWidth={1.6}/>}
              {muted ? "raise a hand" : "you're live"}
            </button>
            <button onClick={() => {
                      if (navigator.share) navigator.share({ title: room.name, text: room.topic }).catch(() => {});
                      else { navigator.clipboard?.writeText(`${room.name} — ${room.topic}`); }
                    }}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.ink }}>
              <Heart className="w-4 h-4" strokeWidth={1.6}/>
            </button>
            <button className="h-11 sm:h-12 w-11 sm:w-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.ink }}>
              <Volume2 className="w-4 h-4" strokeWidth={1.6}/>
            </button>
            <button className="h-11 sm:h-12 w-11 sm:w-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.ink }}>
              <MoreHorizontal className="w-4 h-4" strokeWidth={1.6}/>
            </button>
            <Link to="/community/rooms"
                  className="ml-auto h-11 sm:h-12 px-4 sm:px-5 rounded-full flex items-center text-[12.5px] transition hover:-translate-y-0.5"
                  style={{ background: cmy.rose, color: cmy.ink }}>
              softly leave
            </Link>
          </div>
        </section>

        {/* chat */}
        <aside className="rounded-[28px] flex flex-col overflow-hidden" style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, minHeight: 520 }}>
          <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: cmy.border }}>
            <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: cmy.muted }}>side room · anonymous</div>
            <div className="font-serif text-[15px] mt-1">whispers</div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ maxHeight: 480 }}>
            {msgs.length === 0 && (
              <div className="text-[12.5px] text-center py-8" style={{ color: cmy.muted }}>be the first whisper in this room.</div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                <div className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: cmy.muted }}>{m.who} · {timeAgo(m.createdAt)}</div>
                <div className="max-w-[85%] px-4 py-2.5 rounded-[18px] text-[13px] leading-relaxed"
                     style={{
                       background: m.mine ? cmy.ink : m.tone === "guide" ? `linear-gradient(135deg, ${cmy.lavender}, ${cmy.sky})` : cmy.surface2,
                       color: m.mine ? "#F7FAFF" : cmy.ink,
                     }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }}
                className="p-3 border-t flex items-center gap-2" style={{ borderColor: cmy.border }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
                   placeholder="say something soft…"
                   className="flex-1 h-11 px-4 rounded-full outline-none text-[13px]"
                   style={{ background: cmy.surface2, color: cmy.ink }}/>
            <button type="submit" className="h-11 w-11 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: cmy.ink, color: "#F7FAFF" }}>
              <Send className="w-4 h-4" strokeWidth={1.6}/>
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
