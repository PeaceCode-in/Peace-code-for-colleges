import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { getSession, getBuddy, avatarFor, addMessage, upsertSession, type Msg } from "@/lib/buddies-store";
import { ArrowLeft, Send, Mic, Image as ImageIcon, Smile, Paperclip, ShieldAlert, Sparkles, Bookmark, Heart, Reply, Copy, Trash2, MoreHorizontal, Clock, X, Bot, Wind, PenLine, Timer, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/buddies/chat/$id")({
  component: Chat,
});

const OPENERS = [
  "hey — i'm glad you reached out. what's on your mind today?",
  "no rush. i'm here whenever you're ready to type.",
  "hi 🙂 tell me as much or as little as you want.",
];

const BUDDY_REPLIES = [
  "that sounds really heavy. thank you for trusting me with it.",
  "mm. and how long have you been carrying that?",
  "you're allowed to feel this. it's not being dramatic.",
  "what would it look like — even a tiny version — to feel a little lighter tonight?",
  "i've been in a version of that. it's real.",
  "let's slow down for a sec. can you take one deep breath with me?",
  "i hear you. really.",
];

const EMOJIS = ["🙂","🥺","💛","😔","😌","🌿","🫶","☕","🌙","✨","🕯️","🌊"];

const SUGGESTIONS = [
  { icon: Wind, label: "Try a 2-min breathing", to: "/breathe" },
  { icon: PenLine, label: "Journal this moment", to: "/journal" },
  { icon: Timer, label: "Focus block after chat", to: "/focus" },
  { icon: Bot, label: "Ask Peace Bot", to: "/peacebot" },
  { icon: Users, label: "Peer group for this", to: "/buddies/groups" },
];

function Chat() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const session = useMemo(() => getSession(id), [id]);
  const b = session ? getBuddy(session.buddyId) : null;
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

  const [messages, setMessages] = useState<Msg[]>(session?.messages ?? []);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState(session?.status ?? "waiting");
  const [elapsed, setElapsed] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // guard: only accepted/active sessions can enter chat
  useEffect(() => {
    if (!session) return;
    if (session.status === "waiting" || session.status === "declined" || session.status === "rescheduled" || session.status === "cancelled") {
      navigate({ to: "/buddies/request/$id", params: { id: session.id } });
    }
  }, [session, navigate]);

  // seed opener + timer
  useEffect(() => {
    if (!session || !b) return;
    if (session.status !== "accepted" && session.status !== "active") return;
    if (session.messages.length === 0) {
      const seed: Msg[] = [
        { id: "s0", from: "system", kind: "text", text: `session started with ${b.name}`, ts: Date.now() },
        { id: "s1", from: "buddy", kind: "text", text: OPENERS[Math.floor(Math.random()*OPENERS.length)], ts: Date.now() + 400, read: true },
      ];
      session.messages = seed;
      session.status = "active";
      upsertSession(session);
      setMessages(seed);
      setStatus("active");
    } else if (session.status === "accepted") {
      session.status = "active"; upsertSession(session); setStatus("active");
    }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [session, b]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [messages, typing]);

  if (!session || !b) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: palette.bg }}>
      <div className="text-center"><p style={{ color: muted }}>Session not found.</p>
        <Link to="/buddies" className="underline text-[12px]">back to peace buddies</Link></div>
    </div>
  );

  const send = (text: string, kind: Msg["kind"] = "text") => {
    if (!text.trim()) return;
    const withReply = replyTo ? `↪ ${replyTo.text.slice(0,40)}...\n${text}` : text;
    addMessage(session.id, { from: "me", kind, text: withReply, read: true });
    setMessages(getSession(session.id)!.messages);
    setInput(""); setReplyTo(null); setShowEmoji(false);
    setTyping(true);
    setTimeout(() => {
      addMessage(session.id, { from: "buddy", kind: "text", text: BUDDY_REPLIES[Math.floor(Math.random()*BUDDY_REPLIES.length)], read: true });
      setMessages(getSession(session.id)!.messages);
      setTyping(false);
    }, 1200 + Math.random()*1400);
  };

  const react = (msgId: string, r: string) => {
    const s = getSession(session.id)!;
    const m = s.messages.find(x=>x.id===msgId); if (!m) return;
    m.reactions = m.reactions?.includes(r) ? m.reactions.filter(x=>x!==r) : [...(m.reactions||[]), r];
    upsertSession(s); setMessages([...s.messages]);
  };

  const bookmark = (msgId: string) => {
    const s = getSession(session.id)!;
    const m = s.messages.find(x=>x.id===msgId); if (!m) return;
    m.bookmarked = !m.bookmarked; upsertSession(s); setMessages([...s.messages]);
  };

  const deleteMsg = (msgId: string) => {
    const s = getSession(session.id)!;
    s.messages = s.messages.filter(x => x.id !== msgId); upsertSession(s); setMessages(s.messages); setSelectedMsg(null);
  };

  const endSession = () => {
    const s = getSession(session.id)!; s.status = "completed"; upsertSession(s);
    navigate({ to: "/buddies/feedback/$id", params: { id: session.id } });
  };

  const attach = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => send(file.name, file.type.startsWith("image/") ? "image" : "file");
    reader.readAsDataURL(file);
  };

  const mm = String(Math.floor(elapsed/60)).padStart(2,"0");
  const ss = String(elapsed%60).padStart(2,"0");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: palette.bg, color: ink }}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: "var(--pc-header)", borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3">
          <Link to="/buddies" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="back">
            <ArrowLeft className="w-4 h-4"/>
          </Link>
          <div className="relative">
            <img src={avatarFor(b.id)} className="w-10 h-10 rounded-2xl" alt=""/>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: "#22c55e", borderColor: surface }}/>
          </div>
          <div className="flex-1 min-w-0">
            <Link to="/buddies/$id" params={{ id: b.id }} className="font-serif text-[15px] truncate block" style={{ color: ink }}>{b.name}</Link>
            <div className="text-[10.5px] flex items-center gap-1.5" style={{ color: muted }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }}/>
              {status === "active" ? "active now" : status} · {typing ? "typing…" : "peer listener"}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10.5px] px-2.5 py-1 rounded-full" style={{ background: surface2, color: muted }}>
            <Clock className="w-3 h-3"/> {mm}:{ss}
          </div>
          <Link to="/buddies/emergency" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fef2f2", color: "#e63946" }} aria-label="emergency">
            <ShieldAlert className="w-4 h-4"/>
          </Link>
          <button onClick={()=>setShowEnd(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="end session">
            <MoreHorizontal className="w-4 h-4"/>
          </button>
        </div>

        {/* Pinned resources */}
        <div className="px-4 lg:px-6 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {SUGGESTIONS.slice(0,3).map(({icon:Ic, label, to}) => (
            <Link key={label} to={to} className="text-[10.5px] px-2.5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap" style={{ background: soft, color: primary }}>
              <Ic className="w-2.5 h-2.5"/> {label}
            </Link>
          ))}
          <button onClick={()=>setShowSuggestions(true)} className="text-[10.5px] px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap" style={{ background: surface2, color: muted }}>
            <Sparkles className="w-2.5 h-2.5"/> more
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-6" style={{ background: `linear-gradient(180deg, ${palette.bg}, ${soft} 200%)` }}>
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.map((m) => {
            if (m.from === "system") return (
              <div key={m.id} className="text-center text-[10px] py-1" style={{ color: muted }}>· {m.text} ·</div>
            );
            const mine = m.from === "me";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} gap-2 group`}>
                {!mine && <img src={avatarFor(b.id)} className="w-7 h-7 rounded-full shrink-0 self-end" alt=""/>}
                <div className="max-w-[75%] relative" onDoubleClick={()=>setSelectedMsg(m.id)}>
                  <div className="px-4 py-2.5 rounded-3xl relative"
                    style={{ background: mine ? ink : surface, color: mine ? surface : ink, border: `1px solid ${border}`,
                      borderBottomRightRadius: mine ? "6px" : undefined, borderBottomLeftRadius: !mine ? "6px" : undefined }}>
                    {m.kind === "image" && <div className="text-[10px] opacity-60 mb-1">📎 image · {m.text}</div>}
                    {m.kind === "file" && <div className="text-[10px] opacity-60 mb-1">📎 file · {m.text}</div>}
                    {m.kind === "voice" && <div className="text-[10px] opacity-60 mb-1">🎤 voice note · {m.text}</div>}
                    {m.kind === "text" && <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                    {m.reactions && m.reactions.length > 0 && (
                      <div className="absolute -bottom-3 right-2 flex gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: surface, border: `1px solid ${border}` }}>
                        {m.reactions.map((r,i)=><span key={i}>{r}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1 text-[9.5px]" style={{ color: muted }}>
                    <span>{new Date(m.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    {mine && m.read && <span>· read</span>}
                    {m.bookmarked && <Bookmark className="w-2.5 h-2.5" fill="currentColor" style={{ color: primary }}/>}
                  </div>

                  {/* hover actions */}
                  <div className={`absolute ${mine ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} top-0 opacity-0 group-hover:opacity-100 flex gap-1 transition`}>
                    <button onClick={()=>react(m.id, "❤️")} className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: surface, border: `1px solid ${border}` }}>❤️</button>
                    <button onClick={()=>setReplyTo(m)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><Reply className="w-3 h-3"/></button>
                    <button onClick={()=>bookmark(m.id)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><Bookmark className="w-3 h-3" fill={m.bookmarked?"currentColor":"none"}/></button>
                    <button onClick={()=>{ navigator.clipboard?.writeText(m.text); }} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><Copy className="w-3 h-3"/></button>
                    {mine && <button onClick={()=>deleteMsg(m.id)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><Trash2 className="w-3 h-3" style={{ color: primary }}/></button>}
                  </div>
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex items-end gap-2">
              <img src={avatarFor(b.id)} className="w-7 h-7 rounded-full" alt=""/>
              <div className="px-4 py-3 rounded-3xl flex gap-1" style={{ background: surface, border: `1px solid ${border}`, borderBottomLeftRadius: 6 }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: muted }}/>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: muted, animationDelay: "0.2s" }}/>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: muted, animationDelay: "0.4s" }}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 backdrop-blur-xl" style={{ background: "var(--pc-header)", borderTop: `1px solid ${border}` }}>
        {replyTo && (
          <div className="px-4 lg:px-6 pt-2 flex items-center gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-[11px] flex items-center gap-2" style={{ background: surface2 }}>
              <Reply className="w-3 h-3 opacity-50"/> <span className="truncate opacity-70">{replyTo.text}</span>
            </div>
            <button onClick={()=>setReplyTo(null)}><X className="w-3.5 h-3.5 opacity-60"/></button>
          </div>
        )}
        {showEmoji && (
          <div className="px-4 lg:px-6 pt-2 flex gap-2 flex-wrap">
            {EMOJIS.map(e => <button key={e} onClick={()=>{ setInput(input+e); }} className="w-8 h-8 rounded-full text-[16px]" style={{ background: surface2 }}>{e}</button>)}
          </div>
        )}
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-3 flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e)=>{ const f = e.target.files?.[0]; if (f) attach(f); }}/>
          <button onClick={()=>fileRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2 }} aria-label="attach"><Paperclip className="w-4 h-4"/></button>
          <button onClick={()=>fileRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2 }} aria-label="image"><ImageIcon className="w-4 h-4"/></button>
          <button onClick={()=>setShowEmoji(!showEmoji)} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2 }} aria-label="emoji"><Smile className="w-4 h-4"/></button>
          <div className="flex-1 flex items-center gap-2 rounded-3xl px-4 py-2" style={{ background: surface, border: `1px solid ${border}` }}>
            <textarea rows={1} value={input} onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{ if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="say what you need to…"
              className="flex-1 bg-transparent outline-none text-[13.5px] resize-none max-h-32" style={{ color: ink }}/>
          </div>
          {input.trim() ? (
            <button onClick={()=>send(input)} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: ink, color: surface }} aria-label="send"><Send className="w-4 h-4"/></button>
          ) : (
            <button onClick={()=>send("[voice note]", "voice")} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2 }} aria-label="voice"><Mic className="w-4 h-4"/></button>
          )}
        </div>
      </div>

      {/* Suggestions modal */}
      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={()=>setShowSuggestions(false)}>
          <div className="max-w-md w-full rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-serif text-[18px] mb-4" style={{ color: ink }}>Take this further</h3>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map(({icon:Ic, label, to}) => (
                <Link key={label} to={to} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: surface2 }}>
                  <Ic className="w-4 h-4" style={{ color: primary }}/>
                  <span className="text-[12px]" style={{ color: ink }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* End modal */}
      {showEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={()=>setShowEnd(false)}>
          <div className="max-w-sm w-full rounded-3xl p-6 text-center" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-serif text-[18px] mb-2" style={{ color: ink }}>End this session?</h3>
            <p className="text-[12px] mb-4" style={{ color: muted }}>We&apos;ll ask you a couple of gentle questions after.</p>
            <div className="flex gap-2">
              <button onClick={()=>setShowEnd(false)} className="flex-1 py-2.5 rounded-full text-[12px]" style={{ background: surface2, color: ink }}>Keep talking</button>
              <button onClick={endSession} className="flex-1 py-2.5 rounded-full text-[12px]" style={{ background: ink, color: surface }}>End session</button>
            </div>
          </div>
        </div>
      )}

      {selectedMsg && <div className="fixed inset-0 z-40" onClick={()=>setSelectedMsg(null)}/>}
    </div>
  );
}
