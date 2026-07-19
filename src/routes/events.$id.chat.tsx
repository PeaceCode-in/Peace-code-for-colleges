import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Pin, Smile, Image as ImgIcon, Paperclip, Reply, MessageCircle } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, PrimaryBtn, EmptyState } from "@/components/events/primitives";
import { chatFor, eventById, postChat, reactChat, type ChatMessage } from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;
const REACTIONS = ["💛", "🌿", "🙌", "🔥", "😌"];

function Chat() {
  const { id } = Route.useParams();
  const e = eventById(id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = () => setMessages(chatFor(id));
  useEffect(() => { refresh(); }, [id]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);

  if (!e) return <Page><BackBar/><EmptyState title="Event not found" /></Page>;

  const pinned = messages.filter((m) => m.pinned);
  const rest = messages.filter((m) => !m.pinned);

  const send = () => { if (!text.trim()) return; postChat(id, text); setText(""); refresh(); };

  return (
    <Page>
      <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
      <PageTitle
        eyebrow="Community chat"
        title="Say hi. Ask a small thing."
        sub="A soft room for the people going. Be kind. React to be heard."
      />

      {pinned.length > 0 && (
        <Card className="mb-4" tone="soft">
          <div className="flex items-center gap-2 mb-2 text-[10.5px] uppercase tracking-wide" style={{ color: primary }}>
            <Pin className="w-3 h-3"/> Pinned
          </div>
          {pinned.map((m) => (
            <div key={m.id} className="text-[13px]" style={{ color: ink }}>
              <b className="font-serif">{m.author}</b> — {m.text}
            </div>
          ))}
        </Card>
      )}

      <Card padded={false}>
        <div ref={listRef} className="max-h-[520px] overflow-y-auto p-4 space-y-3">
          {rest.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="w-6 h-6 mx-auto" style={{ color: muted }}/>
              <div className="text-[13px] mt-2" style={{ color: muted }}>Say something to start the conversation.</div>
            </div>
          ) : rest.map((m) => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-serif text-[12px]"
                   style={{ background: soft, color: primary }}>{m.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-serif text-[14px]" style={{ color: ink }}>{m.author}</span>
                  <span className="text-[10.5px]" style={{ color: muted }}>{new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: ink }}>{m.text}</p>
                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                  {(m.reactions ?? []).map((r) => (
                    <span key={r} className="rounded-full px-2 h-6 text-[11px] inline-flex items-center"
                          style={{ background: surface2, border: `1px solid ${border}` }}>{r}</span>
                  ))}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 ml-1">
                    {REACTIONS.map((r) => (
                      <button key={r} onClick={() => { reactChat(id, m.id, r); refresh(); }}
                        className="w-6 h-6 rounded-full text-[12px] hover:bg-black/5">{r}</button>
                    ))}
                  </div>
                  <button className="text-[11px] ml-1 inline-flex items-center gap-1" style={{ color: muted }}>
                    <Reply className="w-3 h-3"/> Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-3 sm:p-4 flex items-center gap-2" style={{ borderColor: border, background: surface }}>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ color: muted }} aria-label="Attach image"><ImgIcon className="w-4 h-4"/></button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ color: muted }} aria-label="Attach file"><Paperclip className="w-4 h-4"/></button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); send(); } }}
            placeholder="Write something kind…"
            className="flex-1 h-11 rounded-full px-4 text-[13px] outline-none"
            style={{ background: surface2, border: `1px solid ${border}`, color: ink }}
          />
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ color: muted }} aria-label="Emoji"><Smile className="w-4 h-4"/></button>
          <PrimaryBtn onClick={send}>
            <Send className="w-3.5 h-3.5"/> Send
          </PrimaryBtn>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px]" style={{ color: muted }}>
        <Chip tone="outline">Shared resources</Chip>
        <Chip tone="outline">Photos</Chip>
        <Chip tone="outline">Q&A</Chip>
        <span className="mx-1" style={{ color: border }}>·</span>
        <Link to="/events/$id/live" params={{ id }} style={{ color: primary }}>Live room →</Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/chat")({ component: Chat });
