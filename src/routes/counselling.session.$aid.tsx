import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { getAppointment, getExpert, photoFor, updateAppointment, addMessage, listMessages } from "@/lib/counselling-store";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, Volume2, PhoneOff, MessageSquare, ScreenShare, Sparkles, Paintbrush,
  Captions, Users, Send, LifeBuoy, Signal, X,
} from "lucide-react";

export const Route = createFileRoute("/counselling/session/$aid")({
  component: LiveSession,
});

function LiveSession() {
  const { aid } = useParams({ from: "/counselling/session/$aid" });
  const nav = useNavigate();
  const a = getAppointment(aid);
  const e = a ? getExpert(a.expertId) : null;

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [blur, setBlur] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [notes, setNotes] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [input, setInput] = useState("");
  const [signal, setSignal] = useState(3);
  const [sharing, setSharing] = useState(false);
  const [whiteboard, setWhiteboard] = useState(false);
  const [speaker, setSpeaker] = useState<"default" | "system" | "headset">("default");
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!a || !e) return;
    if (a.status !== "in-progress") updateAppointment(a.id, { status: "in-progress" });
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    const s = setInterval(() => setSignal(2 + Math.floor(Math.random() * 3)), 6000);
    return () => { clearInterval(t); clearInterval(s); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { msgRef.current?.scrollTo({ top: msgRef.current.scrollHeight, behavior: "smooth" }); });

  if (!a || !e) return <div className="p-10 text-center">Session not found.</div>;

  const thread = e.id;
  const messages = listMessages(thread);

  const sendMsg = () => {
    if (!input.trim()) return;
    addMessage({ threadId: thread, from: "me", text: input.trim() });
    setInput("");
    setTimeout(() => addMessage({ threadId: thread, from: "expert", text: "Thank you — noting that." }), 900);
  };

  const endSession = () => {
    updateAppointment(a.id, { status: "completed", counsellorNotes: notes });
    nav({ to: "/counselling/summary/$aid", params: { aid: a.id } });
  };

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-40 flex min-w-0 flex-col" style={{ background: "#0d1220", color: "#fff" }}>
      {/* Top bar */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <img src={photoFor(e.id)} alt="" className="w-9 h-9 shrink-0 rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] truncate">{e.name}</div>
          <div className="text-[11px] opacity-70 tabular-nums">{hh}:{mm}:{ss} · {a.mode} session</div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] opacity-80">
          <Signal className="w-3.5 h-3.5" />
          <span>{signal >= 4 ? "Excellent" : signal >= 3 ? "Good" : "Fair"} connection</span>
        </div>
        <Link to="/counselling/emergency" className="rounded-full px-2.5 sm:px-3 py-1.5 text-[12px] inline-flex items-center gap-1" style={{ background: "#c14a5a" }}>
          <LifeBuoy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Emergency</span>
        </Link>
      </div>

      {/* Main area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="flex-1 relative min-w-0 flex flex-col">
          {/* Video area */}
          <div className="flex-1 min-h-0 flex items-center justify-center relative p-4">
            {/* Counsellor tile */}
            <div className="relative w-full h-full max-h-full rounded-3xl overflow-hidden flex items-center justify-center" style={{ background: "radial-gradient(circle at 30% 20%, #2a3350, #0d1220)", filter: blur ? "blur(0.4px)" : undefined }}>
              <img src={photoFor(e.id)} alt="" className="w-32 h-32 rounded-full opacity-90" />
              <div className="absolute bottom-3 left-3 text-[12px] opacity-80">{e.name}</div>
            </div>
            {/* Self tile */}
            <div className="absolute right-4 bottom-16 w-28 aspect-video rounded-2xl overflow-hidden sm:right-6 sm:bottom-6 sm:w-40" style={{ background: "linear-gradient(135deg,#3b4a75,#20263f)", border: "1px solid rgba(255,255,255,0.14)" }}>
              {!cam ? (
                <div className="w-full h-full flex items-center justify-center text-[11px] opacity-70">Camera off</div>
              ) : (
                <div className="w-full h-full" />
              )}
              <div className="absolute bottom-1.5 left-2 text-[11px] opacity-80">You</div>
            </div>

            {captions && (
              <div className="absolute bottom-3 left-3 right-3 text-center rounded-full px-3 py-1.5 text-[11.5px] sm:bottom-4 sm:left-1/2 sm:right-auto sm:max-w-[70%] sm:-translate-x-1/2 sm:px-4 sm:text-[12.5px]" style={{ background: "rgba(0,0,0,0.55)" }}>
                Take your time. Nothing you say leaves this room.
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="max-w-full overflow-x-auto p-3 sm:p-4 flex items-center justify-start gap-2 sm:justify-center scrollbar-none">
            <Ctrl onClick={() => setMic(v => !v)} active={mic} icon={mic ? Mic : MicOff} label={mic ? "Mic on" : "Mic off"} />
            <Ctrl onClick={() => setCam(v => !v)} active={cam} icon={cam ? Video : VideoOff} label={cam ? "Cam on" : "Cam off"} />
            <Ctrl onClick={() => setBlur(v => !v)} active={blur} icon={Sparkles} label={blur ? "Blur on" : "Blur off"} />
            <Ctrl onClick={() => setCaptions(v => !v)} active={captions} icon={Captions} label="Captions" />
            <Ctrl onClick={() => setSharing(v => !v)} active={sharing} icon={ScreenShare} label={sharing ? "Sharing" : "Share"} />
            <Ctrl onClick={() => setWhiteboard(v => !v)} active={whiteboard} icon={Paintbrush} label="Whiteboard" />
            <Ctrl onClick={() => setSpeaker(s => s === "default" ? "system" : s === "system" ? "headset" : "default")} active={speaker !== "default"} icon={Volume2} label={speaker === "default" ? "Speaker" : speaker === "system" ? "System" : "Headset"} />
            <Ctrl onClick={() => setChatOpen(v => !v)} active={chatOpen} icon={MessageSquare} label="Chat" />
            <button onClick={endSession} className="shrink-0 rounded-full px-4 py-2.5 text-[13px] inline-flex items-center gap-2" style={{ background: "#c14a5a" }}>
              <PhoneOff className="w-4 h-4" /> End
            </button>
          </div>
        </div>

        {/* Side panel */}
        {chatOpen && (
          <div className="fixed inset-x-3 bottom-3 z-50 max-h-[48vh] rounded-3xl border bg-[#0d1220]/95 backdrop-blur-xl flex flex-col lg:static lg:h-auto lg:max-h-none lg:w-[320px] lg:flex-none lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="p-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <MessageSquare className="w-4 h-4 opacity-80" />
              <div className="text-[13px] flex-1">In-session chat</div>
              <button onClick={() => setChatOpen(false)} aria-label="close"><X className="w-4 h-4 opacity-70" /></button>
            </div>
            <div ref={msgRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && <div className="text-[12px] opacity-70">Nothing yet. Say hello.</div>}
              {messages.map(m => (
                <div key={m.id} className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-[13px] ${m.from === "me" ? "ml-auto" : ""}`} style={{ background: m.from === "me" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)" }}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="p-2 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Type a message…" className="flex-1 rounded-full bg-white/10 px-3 py-2 text-[13px] outline-none" />
              <button onClick={sendMsg} className="shrink-0 rounded-full px-3 py-2" style={{ background: "#fff", color: "#0d1220" }}><Send className="w-4 h-4" /></button>
            </div>
            <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[10.5px] uppercase tracking-[0.18em] opacity-70 mb-1">Your live notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Anything you want to remember later." className="w-full rounded-2xl bg-white/5 p-2 text-[13px] outline-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Ctrl({ icon: Icon, active, onClick, label }: { icon: typeof Mic; active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} title={label} className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors" style={{ background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)" }}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
