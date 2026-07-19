import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Save, Star, Trash2, Sparkles, Bot, X, RefreshCw, Zap,
  Heart, Trophy, CloudRain, MapPin, CloudSun, Wand2, PenLine, Lightbulb,
  Maximize2, Minimize2, Bold, Italic, Quote, List, ListOrdered, Heading1, Heading2, Minus, Link as LinkIcon,
} from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  getEntry, upsertEntry, deleteEntry, type JournalEntry, type Mood,
} from "@/lib/journal-store";
import { journalAI } from "@/lib/journal-ai.functions";

export const Route = createFileRoute("/journal/$id")({ component: EditorPage });

const { surface, surface2, border, ink, muted, primary } = palette;

const MOODS: { key: Mood; label: string; emoji: string; color: string }[] = [
  { key: "radiant", label: "radiant", emoji: "☀️", color: "#F5C97A" },
  { key: "calm",    label: "calm",    emoji: "🌿", color: "#9FC7A8" },
  { key: "okay",    label: "okay",    emoji: "🌤", color: "#AFC9F5" },
  { key: "low",     label: "low",     emoji: "🌧", color: "#B7BFD9" },
  { key: "heavy",   label: "heavy",   emoji: "🌫", color: "#8A93B0" },
];

function EditorPage() {
  const { id } = useParams({ from: "/journal/$id" });
  const navigate = useNavigate();
  const askAI = useServerFn(journalAI);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ kind: string; text: string } | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const [zen, setZen] = useState(false);
  const [font, setFont] = useState<"serif" | "sans" | "mono">("serif");
  const [fontSize, setFontSize] = useState(19);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const e = getEntry(id);
    if (!e) navigate({ to: "/journal" });
    else setEntry(e);
  }, [id, navigate]);

  // auto-save debounced
  useEffect(() => {
    if (!entry) return;
    const t = setTimeout(() => {
      const status = entry.body.trim() || entry.title.trim() ? "saved" : "draft";
      upsertEntry({ ...entry, status });
      setSavedTick((n) => n + 1);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.body, entry?.title, entry?.mood, entry?.energy, entry?.gratitude, entry?.wins, entry?.challenges, entry?.tags, entry?.favorite]);

  const words = useMemo(() => (entry?.body.trim().split(/\s+/).filter(Boolean).length ?? 0), [entry?.body]);
  const readMin = Math.max(1, Math.round(words / 220));

  

  function patch(p: Partial<JournalEntry>) {
    setEntry((e) => (e ? { ...e, ...p } : e));
  }

  async function runAI(kind: "reflect" | "rewrite" | "continue" | "analyze") {
    if (!entry) return;
    setAiLoading(kind);
    setAiResult(null);
    try {
      const res = await askAI({ data: { kind, text: entry.body, mood: entry.mood ?? "" } });
      setAiResult({ kind, text: res.text || "" });
      if (kind === "reflect") patch({ aiSummary: res.text });
    } catch { setAiResult({ kind, text: "peace bot is resting. try again in a moment." }); }
    finally { setAiLoading(null); }
  }

  function insertAtCursor(txt: string) {
    if (!bodyRef.current || !entry) return;
    const ta = bodyRef.current;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = entry.body.slice(0, s) + txt + entry.body.slice(e);
    patch({ body: next });
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + txt.length, s + txt.length); }, 0);
  }

  // wrap current selection with prefix/suffix (for bold, italic, etc.)
  function wrapSelection(prefix: string, suffix: string = prefix, placeholder = "") {
    if (!bodyRef.current || !entry) return;
    const ta = bodyRef.current;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = entry.body.slice(s, e) || placeholder;
    const next = entry.body.slice(0, s) + prefix + sel + suffix + entry.body.slice(e);
    patch({ body: next });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length + sel.length);
    }, 0);
  }

  // prepend a line marker (#, >, -, 1.) to current line
  function prefixLine(marker: string) {
    if (!bodyRef.current || !entry) return;
    const ta = bodyRef.current;
    const s = ta.selectionStart;
    const before = entry.body.slice(0, s);
    const lineStart = before.lastIndexOf("\n") + 1;
    const next = entry.body.slice(0, lineStart) + marker + entry.body.slice(lineStart);
    patch({ body: next });
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + marker.length, s + marker.length); }, 0);
  }

  // zen (fullscreen) shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zen) setZen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); wrapSelection("**", "**", "bold"); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") { e.preventDefault(); wrapSelection("_", "_", "italic"); }
    };
    window.addEventListener("keydown", onKey);
    if (zen) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zen, entry?.body]);

  const fontFamily = font === "serif" ? "'Fraunces', serif" : font === "mono" ? "'JetBrains Mono', ui-monospace, monospace" : "'DM Sans', sans-serif";

  if (!entry) return <AppShell><div className="p-10 opacity-50">loading…</div></AppShell>;

  const created = new Date(entry.createdAt);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 lg:pt-10 pb-24 font-['DM_Sans',sans-serif]" style={{ color: ink }}>

        {/* top bar */}
        <header className="flex items-center justify-between mb-6">
          <Link to="/journal" className="inline-flex items-center gap-2 text-[12px] opacity-70 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" /> back to journal
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-50">{savedTick > 0 ? "saved" : "draft"} · {words} words · {readMin} min</span>
            <button onClick={() => patch({ favorite: !entry.favorite })}
              className="w-9 h-9 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
              style={{ background: surface, border: `1px solid ${border}` }} aria-label="favorite">
              <Star className="w-3.5 h-3.5" style={{ color: entry.favorite ? primary : muted }} fill={entry.favorite ? primary : "transparent"} />
            </button>
            <button onClick={() => { if (confirm("delete this entry?")) { deleteEntry(entry.id); navigate({ to: "/journal" }); } }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
              style={{ background: surface, border: `1px solid ${border}` }} aria-label="delete">
              <Trash2 className="w-3.5 h-3.5 opacity-70" />
            </button>
            <button onClick={() => setZen(true)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-[11px] transition hover:-translate-y-0.5"
              style={{ background: surface, color: ink, border: `1px solid ${border}` }}
              title="focus mode (fullscreen)">
              <Maximize2 className="w-3.5 h-3.5" /> focus
            </button>
            <button onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12px] transition hover:-translate-y-0.5"
              style={{ background: ink, color: "#fff" }}>
              <Sparkles className="w-3.5 h-3.5" /> peace ai
            </button>
          </div>
        </header>

        {/* canvas */}
        <div className="rounded-[32px] p-6 sm:p-10" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-2">
            {created.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <input value={entry.title} onChange={(e) => patch({ title: e.target.value })}
            placeholder="untitled"
            className="w-full bg-transparent outline-none font-['Fraunces',serif] text-[36px] sm:text-[46px] font-light leading-[1.05] placeholder:opacity-30" />

          {/* mood + energy strip */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {MOODS.map((m) => (
                <button key={m.key} onClick={() => patch({ mood: m.key })}
                  className="text-[11px] px-2.5 h-7 rounded-full inline-flex items-center gap-1.5 transition"
                  style={{
                    background: entry.mood === m.key ? m.color : surface2,
                    color: entry.mood === m.key ? "#fff" : ink,
                    border: `1px solid ${border}`,
                  }}>
                  <span>{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Zap className="w-3.5 h-3.5 opacity-60" />
              <input type="range" min={0} max={5} value={entry.energy}
                onChange={(e) => patch({ energy: Number(e.target.value) })}
                className="accent-current" style={{ accentColor: primary }} />
              <span className="text-[11px] opacity-60 w-6">{entry.energy}/5</span>
            </div>
          </div>

          {/* formatting toolbar */}
          <FormatToolbar
            onWrap={wrapSelection}
            onPrefix={prefixLine}
            onInsert={insertAtCursor}
            font={font} setFont={setFont}
            fontSize={fontSize} setFontSize={setFontSize}
          />

          <textarea ref={bodyRef}
            value={entry.body}
            onChange={(e) => patch({ body: e.target.value })}
            placeholder="write freely. no one is watching…"
            style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: 1.7 }}
            className="w-full bg-transparent outline-none mt-3 min-h-[380px] placeholder:opacity-30 resize-none" />

          {/* prompt inserts */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
            {[
              { label: "gratitude", txt: "\n\n🌿 grateful for: " },
              { label: "a win", txt: "\n\n🏆 today's win: " },
              { label: "challenge", txt: "\n\n🌧 challenge: " },
              { label: "letting go", txt: "\n\n🍃 letting go of: " },
              { label: "note to self", txt: "\n\n✉️ note to self — " },
            ].map((b) => (
              <button key={b.label} onClick={() => insertAtCursor(b.txt)}
                className="text-[11px] px-3 h-7 rounded-full inline-flex items-center gap-1.5"
                style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>
                <PenLine className="w-3 h-3" />{b.label}
              </button>
            ))}
          </div>
        </div>

        {/* side lists */}
        <div className="grid gap-4 sm:grid-cols-3 mt-6">
          <ListCard title="gratitude" icon={<Heart className="w-3.5 h-3.5" />} items={entry.gratitude}
            onChange={(gratitude) => patch({ gratitude })} placeholder="one small thing…" />
          <ListCard title="wins" icon={<Trophy className="w-3.5 h-3.5" />} items={entry.wins}
            onChange={(wins) => patch({ wins })} placeholder="a quiet win…" />
          <ListCard title="challenges" icon={<CloudRain className="w-3.5 h-3.5" />} items={entry.challenges}
            onChange={(challenges) => patch({ challenges })} placeholder="what felt heavy…" />
        </div>

        {/* meta */}
        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          <MetaField icon={<MapPin className="w-3.5 h-3.5" />} label="location"
            value={entry.location ?? ""} onChange={(location) => patch({ location })} />
          <MetaField icon={<CloudSun className="w-3.5 h-3.5" />} label="weather"
            value={entry.weather ?? ""} onChange={(weather) => patch({ weather })} />
          <MetaField icon={<span className="text-[11px]">#</span>} label="tags (comma)"
            value={entry.tags.join(", ")}
            onChange={(v) => patch({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
        </div>
      </div>

      {/* ── AI PANEL ────────────────────────────────────── */}
      {aiOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "rgba(29,42,68,0.35)" }} onClick={() => setAiOpen(false)} />
          <aside className="absolute top-0 right-0 bottom-0 w-[92%] max-w-md p-6 overflow-y-auto"
            style={{ background: surface, borderLeft: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" style={{ color: primary }} />
                <span className="text-[9px] tracking-[0.35em] uppercase opacity-60">peace ai</span>
              </div>
              <button onClick={() => setAiOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: surface2 }} aria-label="close ai"><X className="w-4 h-4" /></button>
            </div>
            <h3 className="font-['Fraunces',serif] text-[26px] font-light leading-tight">
              a soft second pair of eyes.
            </h3>
            <p className="text-[12px] opacity-60 mt-2">peace reads only this entry. nothing is shared.</p>

            <div className="grid grid-cols-2 gap-2 mt-6">
              {[
                { k: "reflect",  label: "reflect",  icon: Sparkles, hint: "gentle summary" },
                { k: "analyze",  label: "analyze",  icon: Lightbulb, hint: "stress · positive" },
                { k: "rewrite",  label: "rewrite",  icon: Wand2,    hint: "more beautifully" },
                { k: "continue", label: "continue", icon: PenLine,  hint: "next 2-4 lines" },
              ].map((t) => (
                <button key={t.k} onClick={() => runAI(t.k as any)}
                  disabled={!entry.body.trim() || aiLoading !== null}
                  className="text-left p-4 rounded-2xl transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                  style={{ background: surface2, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-2">
                    <t.icon className="w-3.5 h-3.5" style={{ color: primary }} />
                    <span className="text-[12px]">{t.label}</span>
                    {aiLoading === t.k && <RefreshCw className="w-3 h-3 animate-spin ml-auto" />}
                  </div>
                  <div className="text-[10px] opacity-60 mt-1">{t.hint}</div>
                </button>
              ))}
            </div>

            {aiResult && (
              <div className="mt-6 rounded-2xl p-5 font-['Fraunces',serif]"
                style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="text-[9px] tracking-[0.35em] uppercase opacity-50 mb-2 font-sans">{aiResult.kind}</div>
                <div className="whitespace-pre-wrap text-[15px] italic leading-relaxed">{aiResult.text || "…"}</div>
                {(aiResult.kind === "rewrite" || aiResult.kind === "continue") && aiResult.text && (
                  <button onClick={() => {
                      const next = aiResult.kind === "rewrite" ? aiResult.text : entry.body + "\n\n" + aiResult.text;
                      patch({ body: next });
                      setAiResult(null);
                    }}
                    className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full text-[11px] font-sans"
                    style={{ background: ink, color: "#fff" }}>
                    <Save className="w-3 h-3" /> apply to entry
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── ZEN FULLSCREEN WRITING ─────────────────────── */}
      {zen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true"
             style={{ background: `radial-gradient(1000px 500px at 50% 0%, ${surface2}, ${surface} 60%)`, color: ink }}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 backdrop-blur-md"
               style={{ background: `${surface}CC`, borderBottom: `1px solid ${border}` }}>
            <div className="flex items-center gap-3 text-[10px] tracking-[0.35em] uppercase opacity-60">
              <span>{created.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
              <span className="opacity-40">·</span>
              <span>{words} words · {readMin} min</span>
              <span className="opacity-40">·</span>
              <span>{savedTick > 0 ? "saved" : "draft"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FormatToolbar compact
                onWrap={wrapSelection}
                onPrefix={prefixLine}
                onInsert={insertAtCursor}
                font={font} setFont={setFont}
                fontSize={fontSize} setFontSize={setFontSize}
              />
              <button onClick={() => setZen(false)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[11px]"
                style={{ background: ink, color: "#fff" }}>
                <Minimize2 className="w-3.5 h-3.5"/> exit
              </button>
            </div>
          </div>

          <div className="h-full overflow-y-auto pt-24 pb-24 px-6">
            <div className="max-w-3xl mx-auto">
              <input value={entry.title} onChange={(e) => patch({ title: e.target.value })}
                placeholder="untitled"
                className="w-full bg-transparent outline-none font-['Fraunces',serif] text-[48px] sm:text-[64px] font-light leading-[1.02] placeholder:opacity-25 mb-8"/>
              <textarea
                value={entry.body}
                onChange={(e) => patch({ body: e.target.value })}
                placeholder="the room is quiet. begin anywhere…"
                autoFocus
                style={{ fontFamily, fontSize: `${fontSize + 2}px`, lineHeight: 1.8 }}
                className="w-full bg-transparent outline-none min-h-[70vh] placeholder:opacity-25 resize-none"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); wrapSelection("**","**","bold"); }
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") { e.preventDefault(); wrapSelection("_","_","italic"); }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FormatToolbar({ onWrap, onPrefix, onInsert, font, setFont, fontSize, setFontSize, compact }: {
  onWrap: (p: string, s?: string, ph?: string) => void;
  onPrefix: (m: string) => void;
  onInsert: (t: string) => void;
  font: "serif" | "sans" | "mono";
  setFont: (f: "serif" | "sans" | "mono") => void;
  fontSize: number;
  setFontSize: (n: number) => void;
  compact?: boolean;
}) {
  const btn = "w-8 h-8 rounded-lg inline-flex items-center justify-center transition hover:-translate-y-0.5";
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "mt-5 pt-4"}`}
         style={compact ? {} : { borderTop: `1px solid ${border}` }}>
      <button className={btn} title="heading" style={{ background: surface2 }} onClick={() => onPrefix("# ")}><Heading1 className="w-3.5 h-3.5"/></button>
      <button className={btn} title="subheading" style={{ background: surface2 }} onClick={() => onPrefix("## ")}><Heading2 className="w-3.5 h-3.5"/></button>
      <span className="w-px h-4 opacity-20" style={{ background: ink }}/>
      <button className={btn} title="bold (⌘B)" style={{ background: surface2 }} onClick={() => onWrap("**","**","bold")}><Bold className="w-3.5 h-3.5"/></button>
      <button className={btn} title="italic (⌘I)" style={{ background: surface2 }} onClick={() => onWrap("_","_","italic")}><Italic className="w-3.5 h-3.5"/></button>
      <button className={btn} title="quote" style={{ background: surface2 }} onClick={() => onPrefix("> ")}><Quote className="w-3.5 h-3.5"/></button>
      <span className="w-px h-4 opacity-20" style={{ background: ink }}/>
      <button className={btn} title="bullet list" style={{ background: surface2 }} onClick={() => onPrefix("- ")}><List className="w-3.5 h-3.5"/></button>
      <button className={btn} title="numbered list" style={{ background: surface2 }} onClick={() => onPrefix("1. ")}><ListOrdered className="w-3.5 h-3.5"/></button>
      <button className={btn} title="divider" style={{ background: surface2 }} onClick={() => onInsert("\n\n———\n\n")}><Minus className="w-3.5 h-3.5"/></button>
      <button className={btn} title="link" style={{ background: surface2 }} onClick={() => onWrap("[", "](https://)", "text")}><LinkIcon className="w-3.5 h-3.5"/></button>
      <span className="w-px h-4 opacity-20" style={{ background: ink }}/>
      <div className="flex items-center gap-1 rounded-full px-1 py-0.5" style={{ background: surface2 }}>
        {(["serif","sans","mono"] as const).map((f) => (
          <button key={f} onClick={() => setFont(f)}
            className="text-[10px] px-2 h-6 rounded-full tracking-wide"
            style={{ background: font === f ? ink : "transparent", color: font === f ? "#fff" : ink }}>
            {f === "serif" ? "Aa" : f === "mono" ? "</>" : "aa"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-0.5 rounded-full px-1 py-0.5" style={{ background: surface2 }}>
        <button onClick={() => setFontSize(Math.max(14, fontSize - 1))} className="w-6 h-6 text-[12px]">−</button>
        <span className="text-[10px] opacity-60 w-6 text-center">{fontSize}</span>
        <button onClick={() => setFontSize(Math.min(28, fontSize + 1))} className="w-6 h-6 text-[12px]">+</button>
      </div>
    </div>
  );
}


function ListCard({ title, icon, items, onChange, placeholder }:
  { title: string; icon: React.ReactNode; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 opacity-60 mb-3">
        {icon}<span className="text-[9px] tracking-[0.32em] uppercase">{title}</span>
      </div>
      <ul className="flex flex-col gap-1.5 text-[13px]">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <span className="opacity-40 mt-0.5">·</span>
            <span className="flex-1">{it}</span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-60 text-[10px]">×</button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); }
          }}
          placeholder={placeholder}
          className="bg-transparent outline-none text-[12px] flex-1 placeholder:opacity-40" />
        <button onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}
          className="text-[11px] opacity-60 hover:opacity-100">add</button>
      </div>
    </div>
  );
}

function MetaField({ icon, label, value, onChange }:
  { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: surface, border: `1px solid ${border}` }}>
      <span className="opacity-60">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] tracking-[0.3em] uppercase opacity-50">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none text-[13px] w-full mt-0.5 placeholder:opacity-40" />
      </div>
    </div>
  );
}
