import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Send, Mic, Paperclip, Image as ImageIcon, FileText, Camera, Smile,
  Pin, Bookmark, Copy, Trash2, Edit3, Volume2, Languages, Reply, MoreHorizontal,
  Sparkles, Wind, PenLine, ClipboardList, Heart, Brain, Target, Star, Archive,
} from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  getConv, upsertConv, addMsg, patchMsg, removeMsg, newConv, loadPrefs, loadMems,
  STUDENT_CONTEXT, type Conversation, type Msg, type Attachment,
} from "@/lib/peacebot-store";
import { peacebotReply } from "@/lib/peacebot-ai.functions";

export const Route = createFileRoute("/peacebot/c/$id")({
  head: () => ({ meta: [{ title: "Peace Bot · conversation" }, { name: "robots", content: "noindex" }] }),
  component: ConversationPage,
});

const { surface, surface2, border, ink, muted, primary, soft, bg } = palette;

const REACTIONS = ["🌿", "🕊️", "🌙", "☀️", "💭", "🤍"];

const SUGGESTIONS: { keywords: string[]; label: string; to: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { keywords: ["anxious", "anxiety", "panic", "racing", "chest"], label: "try a 4-7-8 breath", to: "/breathe", icon: Wind },
  { keywords: ["overthink", "loop", "spiraling", "can't stop"], label: "journal it in one line", to: "/journal", icon: PenLine },
  { keywords: ["focus", "distracted", "procrastinat", "study"], label: "start a focus session", to: "/focus", icon: Target },
  { keywords: ["sad", "down", "empty", "phq", "depress"], label: "take a quick screening", to: "/screening", icon: ClipboardList },
  { keywords: ["grateful", "thankful", "happy", "celebrate"], label: "plant a gratitude seed", to: "/gratitude", icon: Heart },
  { keywords: ["alone", "lonely", "isolated"], label: "peek into the community", to: "/community", icon: Brain },
];

function detectSuggestions(text: string) {
  const t = text.toLowerCase();
  return SUGGESTIONS.filter((s) => s.keywords.some((k) => t.includes(k))).slice(0, 3);
}

function ConversationPage() {
  const { id } = useParams({ from: "/peacebot/c/$id" });
  const nav = useNavigate();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const c = getConv(id);
    if (c) setConv(c);
    else {
      const fresh = newConv("free");
      fresh.id = id;
      upsertConv(fresh);
      setConv(fresh);
    }
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conv?.messages.length, sending]);

  useEffect(() => { textRef.current?.focus(); }, [id]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || !conv || sending) return;
    setSending(true);
    setInput("");
    setReplyTo(null);

    const prefixed = replyTo ? `↳ replying to: "${truncate(replyTo.text, 60)}"\n\n${text}` : text;
    addMsg(conv.id, { from: "me", text: prefixed });
    const updated = getConv(conv.id)!;
    setConv({ ...updated });

    try {
      const prefs = loadPrefs();
      const mems = loadMems().filter((m) => m.pinned).map((m) => m.text).concat(loadMems().filter((m) => !m.pinned).slice(0, 5).map((m) => m.text));
      const res = await peacebotReply({
        data: {
          messages: updated.messages.map((m) => ({ from: m.from, text: m.text })),
          convType: conv.type,
          avatar: prefs.avatar,
          length: prefs.length,
          style: prefs.style,
          memories: mems,
          context: STUDENT_CONTEXT,
        },
      });
      addMsg(conv.id, { from: "peace", text: res.reply });
      setConv({ ...getConv(conv.id)! });
    } catch {
      addMsg(conv.id, { from: "peace", text: "the line went quiet for a second — try again?" });
      setConv({ ...getConv(conv.id)! });
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async (file: File) => {
    if (!conv) return;
    const isImg = file.type.startsWith("image/");
    const kind: Attachment["kind"] = isImg ? "image" : file.type.includes("audio") ? "audio" : "pdf";
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
    addMsg(conv.id, {
      from: "me",
      text: `attached: ${file.name}`,
      attachments: [{ kind, name: file.name, dataUrl }],
    });
    setConv({ ...getConv(conv.id)! });
    setShowAttach(false);
    setTimeout(() => send(`i just shared ${file.name} — can you look at it and help me understand it?`), 200);
  };

  const togglePinChat = () => { if (!conv) return; const u = { ...conv, pinned: !conv.pinned }; upsertConv(u); setConv(u); };
  const toggleFav = () => { if (!conv) return; const u = { ...conv, favorite: !conv.favorite }; upsertConv(u); setConv(u); };
  const archiveChat = () => { if (!conv) return; const u = { ...conv, archived: !conv.archived }; upsertConv(u); setConv(u); };
  const renameChat = () => {
    if (!conv) return;
    const t = prompt("rename conversation", conv.title); if (!t) return;
    const u = { ...conv, title: t }; upsertConv(u); setConv(u);
  };

  const readAloud = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.02;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  };

  const startVoice = () => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => SpeechRec; SpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { nav({ to: "/peacebot/voice" }); return; }
    const r = new Ctor();
    r.lang = "en-IN"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e: SpeechEvt) => setInput((prev) => (prev ? prev + " " : "") + e.results[0][0].transcript);
    r.start();
  };

  const lastPeace = useMemo(() => conv?.messages.slice().reverse().find((m) => m.from === "peace"), [conv]);
  const suggestions = lastPeace ? detectSuggestions(lastPeace.text + " " + (conv?.messages.at(-2)?.text ?? "")) : [];

  if (!conv) return <div className="min-h-screen flex items-center justify-center" style={{ background: bg, color: muted }}>opening…</div>;

  const fontSize = loadPrefs().fontSize === "l" ? "text-[16px]" : loadPrefs().fontSize === "s" ? "text-[13px]" : "text-[14.5px]";
  const bubbleRadius = loadPrefs().bubble === "square" ? "rounded-md" : loadPrefs().bubble === "flat" ? "rounded-lg" : "rounded-3xl";

  return (
    <AppShell>
      <div className="h-[100dvh] flex flex-col" style={{ color: ink }}>
      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 h-16 rounded-2xl mt-2 mx-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80" style={{ background: surface, border: `1px solid ${border}` }} aria-label="back">
            <ArrowLeft className="w-4 h-4"/>
          </Link>
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-50">peace bot</div>
            <button onClick={renameChat} className="font-serif text-[16px] truncate max-w-[46vw] hover:underline text-left">{conv.title}</button>
          </div>
          {conv.emotion && <span className="ml-2 text-[10px] px-2 py-1 rounded-full" style={{ background: soft, color: ink }}>{conv.emotion}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn label={conv.pinned ? "unpin" : "pin"} onClick={togglePinChat} active={conv.pinned}><Pin className="w-3.5 h-3.5"/></IconBtn>
          <IconBtn label="favorite" onClick={toggleFav} active={conv.favorite}><Star className="w-3.5 h-3.5"/></IconBtn>
          <IconBtn label="archive" onClick={archiveChat} active={conv.archived}><Archive className="w-3.5 h-3.5"/></IconBtn>
          <Link to="/peacebot/voice" className="w-9 h-9 rounded-full hidden sm:flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }} aria-label="voice mode"><Mic className="w-3.5 h-3.5"/></Link>
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          {conv.messages.map((m) => {
            const mine = m.from === "me";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
                <div className="max-w-[82%] space-y-1.5">
                  {m.attachments?.map((a, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden max-w-xs" style={{ background: surface2, border: `1px solid ${border}` }}>
                      {a.kind === "image" && a.dataUrl ? (
                        <img src={a.dataUrl} alt={a.name} className="w-full h-auto"/>
                      ) : (
                        <div className="flex items-center gap-2 p-3 text-[12px]">
                          <FileText className="w-4 h-4 opacity-60"/>{a.name}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className={`relative ${bubbleRadius} px-4 py-3 ${fontSize} leading-relaxed whitespace-pre-wrap`}
                       style={mine
                         ? { background: ink, color: "var(--pc-bg)" }
                         : { background: surface, color: ink, border: `1px solid ${border}` }}>
                    {editingId === m.id ? (
                      <textarea autoFocus defaultValue={m.text} onBlur={(e) => { patchMsg(conv.id, m.id, { text: e.target.value, edited: true }); setConv({ ...getConv(conv.id)! }); setEditingId(null); }} className="w-full bg-transparent outline-none resize-none" rows={3}/>
                    ) : (
                      <>{m.text}{m.edited && <span className="ml-1.5 text-[9px] opacity-50">(edited)</span>}</>
                    )}
                    {m.pinned && <Pin className="w-3 h-3 absolute -top-1.5 -right-1.5" style={{ color: primary }}/>}
                    {m.bookmarked && <Bookmark className="w-3 h-3 absolute -top-1.5 -left-1.5" style={{ color: primary }}/>}
                  </div>

                  {m.reaction && <div className="text-[13px] px-2">{m.reaction}</div>}

                  {/* actions */}
                  <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ${mine ? "justify-end" : "justify-start"}`}>
                    <MicroBtn onClick={() => setReplyTo(m)} label="reply"><Reply className="w-3 h-3"/></MicroBtn>
                    <MicroBtn onClick={() => { navigator.clipboard?.writeText(m.text); }} label="copy"><Copy className="w-3 h-3"/></MicroBtn>
                    <MicroBtn onClick={() => { patchMsg(conv.id, m.id, { pinned: !m.pinned }); setConv({ ...getConv(conv.id)! }); }} label="pin"><Pin className="w-3 h-3"/></MicroBtn>
                    <MicroBtn onClick={() => { patchMsg(conv.id, m.id, { bookmarked: !m.bookmarked }); setConv({ ...getConv(conv.id)! }); }} label="bookmark"><Bookmark className="w-3 h-3"/></MicroBtn>
                    <MicroBtn onClick={() => readAloud(m.text)} label="read aloud"><Volume2 className="w-3 h-3"/></MicroBtn>
                    {mine && <MicroBtn onClick={() => setEditingId(m.id)} label="edit"><Edit3 className="w-3 h-3"/></MicroBtn>}
                    <MicroBtn onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)} label="more"><MoreHorizontal className="w-3 h-3"/></MicroBtn>
                  </div>

                  {openMenu === m.id && (
                    <div className="rounded-xl p-2 flex flex-wrap gap-1" style={{ background: surface, border: `1px solid ${border}` }}>
                      {REACTIONS.map((r) => (
                        <button key={r} onClick={() => { patchMsg(conv.id, m.id, { reaction: r }); setConv({ ...getConv(conv.id)! }); setOpenMenu(null); }} className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/5">{r}</button>
                      ))}
                      <button onClick={() => { send(`translate this to hindi: "${m.text}"`); setOpenMenu(null); }} className="px-2 h-7 text-[10px] rounded-full flex items-center gap-1" style={{ background: surface2 }}><Languages className="w-3 h-3"/> translate</button>
                      <button onClick={() => { removeMsg(conv.id, m.id); setConv({ ...getConv(conv.id)! }); setOpenMenu(null); }} className="px-2 h-7 text-[10px] rounded-full flex items-center gap-1" style={{ background: surface2, color: "#c33" }}><Trash2 className="w-3 h-3"/> delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-start">
              <div className={`${bubbleRadius} px-4 py-3`} style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: muted }}/>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:200ms]" style={{ background: muted }}/>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:400ms]" style={{ background: muted }}/>
                </div>
              </div>
            </div>
          )}

          {/* AI recommendations */}
          {!sending && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] tracking-[0.3em] uppercase opacity-50 self-center pr-1">suggested</span>
              {suggestions.map((s) => {
                const I = s.icon;
                return (
                  <Link key={s.label} to={s.to} className="px-3 h-8 rounded-full text-[11px] flex items-center gap-1.5 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                    <I className="w-3 h-3"/> {s.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* reply bar */}
      {replyTo && (
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6">
          <div className="flex items-center justify-between rounded-t-xl px-3 py-2 text-[11px]" style={{ background: soft, color: ink }}>
            <span>replying to: {truncate(replyTo.text, 80)}</span>
            <button onClick={() => setReplyTo(null)} className="opacity-60 hover:opacity-100">×</button>
          </div>
        </div>
      )}

      {/* composer */}
      <div className="relative z-10 pt-2 pb-4 px-4 sm:px-6" style={{ borderTop: `1px solid ${border}`, background: "var(--pc-header)" }}>
        <div className="max-w-3xl mx-auto">
          {showAttach && (
            <div className="mb-3 grid grid-cols-4 gap-2">
              <AttachBtn onClick={() => fileRef.current?.click()} icon={ImageIcon} label="image"/>
              <AttachBtn onClick={() => fileRef.current?.click()} icon={FileText} label="pdf / doc"/>
              <AttachBtn onClick={() => alert("camera opens on mobile devices")} icon={Camera} label="camera"/>
              <AttachBtn onClick={() => alert("audio recording — coming soon")} icon={Mic} label="audio"/>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-3xl p-2 pl-4" style={{ background: surface, border: `1px solid ${border}` }}>
            <button onClick={() => setShowAttach((v) => !v)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2 }} aria-label="attach"><Paperclip className="w-4 h-4"/></button>
            <textarea
              ref={textRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="say anything…"
              className="flex-1 bg-transparent outline-none resize-none py-2 max-h-40 text-[14.5px] placeholder:opacity-40"
              style={{ color: ink }}
            />
            <button onClick={() => alert("emoji picker — tap ⌘/⊞ + . on desktop")} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hidden sm:flex" style={{ background: surface2 }} aria-label="emoji"><Smile className="w-4 h-4"/></button>
            <button onClick={startVoice} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2 }} aria-label="voice"><Mic className="w-4 h-4"/></button>
            <button onClick={() => send()} disabled={!input.trim() || sending} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition disabled:opacity-40" style={{ background: ink, color: "var(--pc-bg)" }} aria-label="send">
              <Send className="w-4 h-4"/>
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] opacity-50">
            <span>peace remembers you · <Link to="/peacebot/memory" className="underline">memory</Link></span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> multimodal · text · voice · files</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAttach(f); }}/>
        </div>
      </div>
      </div>
    </AppShell>
  );
}

type SpeechRec = { start: () => void; lang: string; interimResults: boolean; maxAlternatives: number; onresult: (e: SpeechEvt) => void };
type SpeechEvt = { results: { 0: { transcript: string } }[] };

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }
function IconBtn({ children, onClick, label, active }: { children: React.ReactNode; onClick: () => void; label: string; active?: boolean }) {
  return <button onClick={onClick} aria-label={label} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80" style={{ background: active ? soft : surface, border: `1px solid ${border}`, color: active ? ink : muted }}>{children}</button>;
}
function MicroBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button onClick={onClick} aria-label={label} className="w-6 h-6 rounded-full flex items-center justify-center transition hover:opacity-100 opacity-60" style={{ background: surface2 }}>{children}</button>;
}
function AttachBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 py-4 rounded-2xl transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
      <Icon className="w-4 h-4 opacity-60"/>
      <span className="text-[11px]" style={{ color: muted }}>{label}</span>
    </button>
  );
}
