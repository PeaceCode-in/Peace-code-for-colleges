import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Square, Play, Pause, RefreshCw, Sparkles, Check, ChevronRight, Trash2, Save } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadEntries, newEntry, upsertEntry, type JournalEntry, type Mood, type VoiceNote } from "@/lib/journal-store";
import { transcribeVoice, summarizeVoice } from "@/lib/journal-voice.functions";

export const Route = createFileRoute("/journal/voice")({ component: VoiceJournal });

const { surface, surface2, border, ink, muted, primary, lavender, soft } = palette;

type Recording = { blob: Blob; url: string; mime: string; duration: number };
type Parsed = { title: string; mood: Mood | null; summary: string; body: string };

const MOODS: Mood[] = ["radiant", "calm", "okay", "low", "heavy"];

function VoiceJournal() {
  const navigate = useNavigate();
  const transcribe = useServerFn(transcribeVoice);
  const summarize = useServerFn(summarizeVoice);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [rec, setRec] = useState<Recording | null>(null);
  const [playing, setPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [phase, setPhase] = useState<"idle" | "transcribing" | "summarizing" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saveTarget, setSaveTarget] = useState<"new" | string>("new");

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    setEntries(loadEntries().filter((e) => e.status === "saved").slice(0, 8));
    return () => { stopStreams(); };
  }, []);

  function stopStreams() {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
    recRef.current = null;
  }

  async function startRecording() {
    setError(null); setTranscript(""); setParsed(null); setRec(null); setPhase("idle");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
        MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startedAt.current) / 1000;
        setRec({ blob, url, mime: mr.mimeType || "audio/webm", duration });
        stopStreams();
      };
      mr.start();
      recRef.current = mr;
      startedAt.current = Date.now();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 100);

      // level meter
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e: any) {
      setError(e?.message?.includes("Permission") ? "microphone permission denied." : "could not open microphone.");
    }
  }

  function stopRecording() {
    setRecording(false);
    try { recRef.current?.stop(); } catch {}
  }

  function discard() {
    if (rec?.url) URL.revokeObjectURL(rec.url);
    setRec(null); setTranscript(""); setParsed(null); setPhase("idle"); setError(null);
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function processRecording() {
    if (!rec) return;
    setError(null); setPhase("transcribing");
    try {
      const base64 = await blobToBase64(rec.blob);
      const t = await transcribe({ data: { base64, mime: rec.mime } });
      const text = (t.text ?? "").trim();
      setTranscript(text);
      if (!text) { setError("nothing was heard — try again with a bit closer to the mic."); setPhase("idle"); return; }
      setPhase("summarizing");
      const s = await summarize({ data: { text } });
      setParsed(parseSummary(s.text ?? ""));
      setPhase("ready");
    } catch (e: any) {
      setError(e?.message ?? "peace couldn't listen just now."); setPhase("idle");
    }
  }

  function togglePlay() {
    const el = audioElRef.current; if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  }

  async function saveIntoEntry() {
    if (!rec || !parsed) return;
    const base64 = await blobToBase64(rec.blob);
    const voice: VoiceNote = {
      id: crypto.randomUUID(),
      dataUrl: `data:${rec.mime};base64,${base64}`,
      mime: rec.mime,
      duration: rec.duration,
      transcript,
      createdAt: new Date().toISOString(),
    };
    let target: JournalEntry;
    if (saveTarget === "new") {
      target = newEntry("voice", {
        title: parsed.title,
        body: parsed.body,
        mood: parsed.mood,
        aiSummary: parsed.summary,
        voiceNotes: [voice],
        status: "saved",
      });
    } else {
      const existing = loadEntries().find((e) => e.id === saveTarget)!;
      target = {
        ...existing,
        body: existing.body ? existing.body + "\n\n" + parsed.body : parsed.body,
        voiceNotes: [...(existing.voiceNotes ?? []), voice],
        aiSummary: parsed.summary,
        status: "saved",
      };
    }
    upsertEntry(target);
    navigate({ to: "/journal/$id", params: { id: target.id } });
  }

  const barCount = 48;
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const wave = Math.abs(Math.sin(i * 0.7 + elapsed * 3.2));
      const height = 6 + wave * level * 40 + (recording ? 4 : 2);
      return height;
    });
  }, [elapsed, level, recording]);

  const timeLabel = formatTime(rec ? rec.duration : elapsed);

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 lg:pt-10 pb-24 font-['DM_Sans',sans-serif]" style={{ color: ink }}>
        <div className="flex items-center gap-2 text-[11px] opacity-60 mb-3">
          <Link to="/journal" className="hover:opacity-100">journal</Link>
          <ChevronRight className="w-3 h-3" />
          <span>voice journal</span>
        </div>

        <header className="mb-8">
          <div className="text-[10px] tracking-[0.4em] uppercase opacity-50">speak your page</div>
          <h1 className="font-['Fraunces',serif] text-[40px] sm:text-[52px] font-light mt-2 leading-none">
            voice <span className="italic" style={{ color: primary }}>journal</span>
          </h1>
          <p className="mt-3 text-[14px] opacity-70 max-w-xl">
            record freely — peace will listen, transcribe it, and offer a soft summary you can save into an entry.
          </p>
        </header>

        {/* ── recorder ─────────────────────────────────── */}
        <section className="relative rounded-[32px] overflow-hidden p-6 sm:p-10 mb-8"
          style={{ background: `linear-gradient(135deg, ${surface} 0%, ${surface2} 100%)`, border: `1px solid ${border}` }}>
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: lavender }} />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: soft }} />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">
                {recording ? "listening…" : rec ? "captured" : "ready when you are"}
              </div>
              <div className="font-['Fraunces',serif] text-[64px] font-light leading-none mt-2 tabular-nums">
                {timeLabel}
              </div>

              <div className="mt-6 flex items-end gap-[3px] h-20">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-full transition-all"
                    style={{
                      height: `${Math.min(100, h)}%`,
                      background: recording ? primary : rec ? ink : muted,
                      opacity: recording ? 0.65 + Math.random() * 0.35 : 0.35,
                    }} />
                ))}
              </div>

              {rec && !recording && (
                <div className="mt-5 flex items-center gap-3">
                  <button onClick={togglePlay}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: surface, border: `1px solid ${border}` }} aria-label={playing ? "pause" : "play"}>
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <audio ref={audioElRef} src={rec.url} onEnded={() => setPlaying(false)} className="hidden" />
                  <button onClick={discard}
                    className="h-10 px-4 rounded-full text-[12px] inline-flex items-center gap-2 transition hover:-translate-y-0.5"
                    style={{ background: surface, border: `1px solid ${border}` }}>
                    <Trash2 className="w-3.5 h-3.5" /> discard
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <button onClick={recording ? stopRecording : startRecording}
                className="relative w-28 h-28 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                style={{
                  background: recording ? "#B7625C" : ink,
                  color: "#fff",
                  boxShadow: recording
                    ? `0 0 0 ${8 + level * 24}px rgba(183,98,92,0.15)`
                    : "0 20px 40px -20px rgba(29,42,68,0.4)",
                }}
                aria-label={recording ? "stop" : "record"}>
                {recording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
              </button>
              <div className="text-[11px] opacity-60">{recording ? "tap to stop" : rec ? "record again" : "tap to record"}</div>
            </div>
          </div>

          {error && (
            <div className="relative mt-6 p-3 rounded-2xl text-[12.5px]"
              style={{ background: "rgba(183,98,92,0.1)", color: "#8A4844", border: `1px solid ${border}` }}>
              {error}
            </div>
          )}

          {rec && !recording && phase === "idle" && (
            <div className="relative mt-6">
              <button onClick={processRecording}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] transition hover:-translate-y-0.5"
                style={{ background: ink, color: "#fff" }}>
                <Sparkles className="w-4 h-4" /> transcribe & summarize
              </button>
            </div>
          )}
          {(phase === "transcribing" || phase === "summarizing") && (
            <div className="relative mt-6 inline-flex items-center gap-2 text-[12px] opacity-70">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {phase === "transcribing" ? "listening to your words…" : "gathering the shape of it…"}
            </div>
          )}
        </section>

        {/* ── transcript + summary ───────────────────── */}
        {(transcript || parsed) && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mb-8">
            <div className="rounded-3xl p-5 sm:p-6" style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-[0.32em] uppercase opacity-60 mb-3">transcript</div>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{transcript}</p>
            </div>

            <div className="rounded-3xl p-5 sm:p-6" style={{ background: "rgba(213,201,247,0.28)", border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-[0.32em] uppercase opacity-60 mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> peace's summary
              </div>
              {!parsed ? (
                <p className="text-[12px] italic opacity-60">a soft summary will appear here.</p>
              ) : (
                <div className="space-y-3">
                  <input value={parsed.title}
                    onChange={(e) => setParsed({ ...parsed, title: e.target.value })}
                    className="w-full font-['Fraunces',serif] text-[22px] font-light bg-transparent outline-none"
                    placeholder="title" />
                  <div className="flex flex-wrap gap-1.5">
                    {MOODS.map((m) => (
                      <button key={m}
                        onClick={() => setParsed({ ...parsed, mood: m })}
                        className="text-[11px] px-2.5 h-7 rounded-full"
                        style={{
                          background: parsed.mood === m ? ink : surface,
                          color: parsed.mood === m ? "#fff" : ink,
                          border: `1px solid ${border}`,
                        }}>{m}</button>
                    ))}
                  </div>
                  <div className="text-[12px] italic opacity-80 font-['Fraunces',serif]">— {parsed.summary}</div>
                  <textarea value={parsed.body}
                    onChange={(e) => setParsed({ ...parsed, body: e.target.value })}
                    rows={7}
                    className="w-full text-[13.5px] leading-relaxed bg-transparent outline-none resize-none"
                    style={{ borderTop: `1px dashed ${border}`, paddingTop: 12 }} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── save ─────────────────────────────────── */}
        {parsed && (
          <section className="rounded-3xl p-5 sm:p-6 mb-24" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.32em] uppercase opacity-60 mb-3">save into</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSaveTarget("new")}
                className="h-9 px-4 rounded-full text-[12px] inline-flex items-center gap-2 transition"
                style={{
                  background: saveTarget === "new" ? ink : surface2,
                  color: saveTarget === "new" ? "#fff" : ink,
                  border: `1px solid ${border}`,
                }}>
                {saveTarget === "new" && <Check className="w-3 h-3" />} a new entry
              </button>
              {entries.map((e) => (
                <button key={e.id} onClick={() => setSaveTarget(e.id)}
                  className="h-9 px-4 rounded-full text-[12px] inline-flex items-center gap-2 transition"
                  style={{
                    background: saveTarget === e.id ? ink : surface2,
                    color: saveTarget === e.id ? "#fff" : ink,
                    border: `1px solid ${border}`,
                  }}>
                  {saveTarget === e.id && <Check className="w-3 h-3" />}
                  {(e.title || "untitled").slice(0, 28)}
                </button>
              ))}
            </div>
            <button onClick={saveIntoEntry}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] transition hover:-translate-y-0.5"
              style={{ background: ink, color: "#fff" }}>
              <Save className="w-4 h-4" /> save to journal
            </button>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function parseSummary(raw: string): Parsed {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const pick = (prefix: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix));
    return line ? line.slice(line.indexOf(":") + 1).trim() : "";
  };
  const moodRaw = pick("mood").toLowerCase();
  const mood: Mood | null = (["radiant", "calm", "okay", "low", "heavy"] as Mood[]).find((m) => moodRaw.includes(m)) ?? null;
  return {
    title: pick("title") || "a voice note",
    mood,
    summary: pick("summary") || "",
    body: pick("body") || raw,
  };
}

function formatTime(s: number) {
  const total = Math.max(0, Math.floor(s));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
