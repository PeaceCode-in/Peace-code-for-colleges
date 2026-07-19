import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Square, Play, Pause, Volume2 } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { newConv, upsertConv, addMsg, STUDENT_CONTEXT, loadPrefs, loadMems } from "@/lib/peacebot-store";
import { peacebotReply } from "@/lib/peacebot-ai.functions";

export const Route = createFileRoute("/peacebot/voice")({
  head: () => ({ meta: [{ title: "Peace Bot · voice" }] }),
  component: VoicePage,
});

const { surface, border, ink, muted, primary, soft, bg } = palette;

type SR = { start: () => void; stop: () => void; abort: () => void; lang: string; continuous: boolean; interimResults: boolean; onresult: (e: SREvt) => void; onend: () => void };
type SREvt = { resultIndex: number; results: { 0: { transcript: string }; isFinal: boolean; length: number }[] };

function VoicePage() {
  const nav = useNavigate();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<{ role: "me" | "peace"; text: string }[]>([]);
  const [live, setLive] = useState("");
  const [rate, setRate] = useState(0.95);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recRef = useRef<SR | null>(null);
  const convRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load(); speechSynthesis.onvoiceschanged = load;
  }, []);

  useEffect(() => {
    const c = newConv("free");
    c.title = "voice conversation";
    upsertConv(c);
    convRef.current = c.id;
  }, []);

  const start = () => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => SR; SpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { alert("your browser doesn't support voice input yet — try chrome"); return; }
    const r = new Ctor();
    r.lang = "en-IN"; r.interimResults = true; r.continuous = true;
    r.onresult = (e) => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (interim) setLive(interim);
      if (final) { setLive(""); void handleFinal(final.trim()); }
    };
    r.onend = () => setListening(false);
    recRef.current = r; r.start(); setListening(true);
  };
  const stop = () => { recRef.current?.stop(); setListening(false); };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate; u.pitch = 1.02;
    if (voices[voiceIdx]) u.voice = voices[voiceIdx];
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    speechSynthesis.speak(u);
  };

  const handleFinal = async (text: string) => {
    if (!text) return;
    setTranscript((t) => [...t, { role: "me", text }]);
    if (convRef.current) addMsg(convRef.current, { from: "me", text });
    // pause listening while replying
    recRef.current?.stop();
    const prefs = loadPrefs();
    const mems = loadMems().filter((m) => m.pinned).map((m) => m.text);
    const messages = [...transcript, { role: "me" as const, text }].map((m) => ({ from: m.role, text: m.text }));
    const res = await peacebotReply({ data: {
      messages, convType: "free", avatar: prefs.avatar, length: "short", style: prefs.style,
      memories: mems, context: STUDENT_CONTEXT,
    }});
    setTranscript((t) => [...t, { role: "peace", text: res.reply }]);
    if (convRef.current) addMsg(convRef.current, { from: "peace", text: res.reply });
    speak(res.reply);
  };

  const interrupt = () => { speechSynthesis.cancel(); setSpeaking(false); };

  return (
    <AppShell>
      <div className="h-[100dvh] flex flex-col" style={{ color: ink }}>
      <header className="relative z-10 flex items-center justify-between px-6 h-16 rounded-2xl mt-2 mx-2">
        <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
        <div className="font-serif text-[16px]">voice mode</div>
        <div className="text-[10px] opacity-50">natural conversation</div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* orb */}
        <div className="relative w-64 h-64 mb-10">
          <div className={`absolute inset-0 rounded-full transition-transform duration-1000 ${listening || speaking ? "scale-110" : "scale-100"}`} style={{ background: `radial-gradient(circle, ${soft}, transparent 70%)` }}/>
          <div className={`absolute inset-8 rounded-full transition-transform duration-700 ${listening ? "scale-105" : "scale-100"}`} style={{ background: `radial-gradient(circle, ${primary}55, transparent 70%)` }}/>
          <div className="absolute inset-14 rounded-full flex items-center justify-center" style={{ background: ink }}>
            <span className="font-serif text-[16px]" style={{ color: "var(--pc-bg)" }}>{listening ? "listening" : speaking ? "speaking" : "tap"}</span>
          </div>
        </div>

        <div className="text-center max-w-xl min-h-[80px]">
          {live && <div className="text-[13px] opacity-60 italic">{live}</div>}
          {transcript.slice(-2).map((t, i) => (
            <div key={i} className={`mt-2 text-[15px] ${t.role === "me" ? "opacity-70" : ""}`} style={{ color: ink }}>
              <span className="text-[9px] tracking-[0.3em] uppercase opacity-40 mr-2">{t.role}</span>{t.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-10">
          {!listening ? (
            <button onClick={start} className="w-16 h-16 rounded-full flex items-center justify-center transition hover:scale-105" style={{ background: ink, color: "var(--pc-bg)" }}><Mic className="w-6 h-6"/></button>
          ) : (
            <button onClick={stop} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#c33", color: "#fff" }}><Square className="w-5 h-5"/></button>
          )}
          {speaking && (
            <button onClick={interrupt} className="px-4 h-11 rounded-full text-[12px]" style={{ background: surface, border: `1px solid ${border}` }}>interrupt</button>
          )}
        </div>

        {/* controls */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-[11px]" style={{ color: muted }}>
          <label className="flex items-center gap-2">
            speed
            <input type="range" min={0.6} max={1.4} step={0.05} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))}/>
            <span>{rate.toFixed(2)}×</span>
          </label>
          {voices.length > 0 && (
            <label className="flex items-center gap-2">
              voice
              <select value={voiceIdx} onChange={(e) => setVoiceIdx(parseInt(e.target.value))} className="bg-transparent border rounded-md px-2 py-1" style={{ borderColor: border, color: ink }}>
                {voices.slice(0, 12).map((v, i) => <option key={i} value={i}>{v.name}</option>)}
              </select>
            </label>
          )}
          <button onClick={() => nav({ to: "/peacebot/c/$id", params: { id: convRef.current ?? "" } })} className="underline">open as text conversation →</button>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
