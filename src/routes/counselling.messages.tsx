import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { myCounsellors, listMessages, addMessage, patchMessage, threadIds, getExpert, photoFor, EXPERTS, addDoc } from "@/lib/counselling-store";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Pin, Bookmark, Archive, Search, Paperclip } from "lucide-react";

export const Route = createFileRoute("/counselling/messages")({
  component: Messages,
});

function Messages() {
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const experts = myCounsellors();
  const ids = threadIds();
  // include every experienced counsellor + any thread
  const threadExperts = useMemo(() => {
    const set = new Set<string>([...experts.map(e => e.id), ...ids]);
    // add the top recommended so users can start a thread
    EXPERTS.slice(0, 3).forEach(e => set.add(e.id));
    return Array.from(set).map(id => getExpert(id)).filter(Boolean) as ReturnType<typeof getExpert>[];
  }, [experts, ids]);

  const [active, setActive] = useState<string | null>(threadExperts[0]?.id ?? null);
  const [tab, setTab] = useState<"inbox" | "pinned" | "bookmarks" | "archived">("inbox");
  const [q, setQ] = useState("");
  const [input, setInput] = useState("");
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [active, tick]);

  const activeExpert = active ? getExpert(active) : null;
  const msgs = active ? listMessages(active).filter(m => {
    if (tab === "pinned") return m.pinned;
    if (tab === "bookmarks") return m.bookmarked;
    if (tab === "archived") return m.archived;
    return !m.archived;
  }).filter(m => q ? m.text.toLowerCase().includes(q.toLowerCase()) : true) : [];

  const send = () => {
    if (!active || !input.trim()) return;
    addMessage({ threadId: active, from: "me", text: input.trim() });
    setInput(""); setTick(x => x + 1);
    setTimeout(() => { addMessage({ threadId: active, from: "expert", text: pickAutoReply() }); setTick(x => x + 1); }, 1100);
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
      <Card pad={false}>
        <div className="p-3" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ background: surface2 }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: muted }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search messages" className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: ink }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {(["inbox","pinned","bookmarks","archived"] as const).map(t => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}
          </div>
        </div>
        <div className="max-h-[36vh] overflow-y-auto lg:max-h-[600px]">
          {threadExperts.map(e => {
            const list = listMessages(e!.id);
            const last = list[list.length - 1];
            const activeC = active === e!.id;
            return (
              <button key={e!.id} onClick={() => setActive(e!.id)} className="w-full flex items-center gap-3 px-3 py-3 text-left" style={{ background: activeC ? soft : "transparent", borderBottom: `1px solid ${border}` }}>
                <img src={photoFor(e!.id)} alt="" className="w-10 h-10 shrink-0 rounded-2xl" style={{ background: surface2 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] truncate" style={{ color: ink }}>{e!.name}</div>
                  <div className="text-[11.5px] truncate" style={{ color: muted }}>{last ? last.text : "Say hello"}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card pad={false} className="flex min-h-[64vh] flex-col lg:min-h-[600px]">
        {activeExpert ? (
          <>
            <div className="flex items-center gap-3 p-3" style={{ borderBottom: `1px solid ${border}` }}>
              <img src={photoFor(activeExpert.id)} alt="" className="w-9 h-9 rounded-xl" style={{ background: surface2 }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ color: ink }}>{activeExpert.name}</div>
                <div className="text-[11.5px]" style={{ color: muted }}>Usually replies in {activeExpert.responseMin} min</div>
              </div>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgs.length === 0 && <div className="text-center text-[13px]" style={{ color: muted }}>No messages here yet.</div>}
              {msgs.map(m => (
                <div key={m.id} className={`max-w-[86%] break-words rounded-2xl px-3 py-2 text-[13.5px] group sm:max-w-[75%] ${m.from === "me" ? "ml-auto" : ""}`} style={{ background: m.from === "me" ? ink : surface2, color: m.from === "me" ? "#fff" : ink }}>
                  <div>{m.text}</div>
                  <div className="mt-1 flex items-center gap-2 opacity-70 text-[10.5px]">
                    <span>{new Date(m.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    <button onClick={() => { patchMessage(m.id, { pinned: !m.pinned }); setTick(x => x + 1); }} aria-label="pin"><Pin className="w-3 h-3" style={{ opacity: m.pinned ? 1 : 0.5 }} /></button>
                    <button onClick={() => { patchMessage(m.id, { bookmarked: !m.bookmarked }); setTick(x => x + 1); }} aria-label="bookmark"><Bookmark className="w-3 h-3" style={{ opacity: m.bookmarked ? 1 : 0.5 }} /></button>
                    <button onClick={() => { patchMessage(m.id, { archived: !m.archived }); setTick(x => x + 1); }} aria-label="archive"><Archive className="w-3 h-3" style={{ opacity: m.archived ? 1 : 0.5 }} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 flex gap-2 items-center" style={{ borderTop: `1px solid ${border}` }}>
              <label className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center cursor-pointer" style={{ background: surface2 }}>
                <Paperclip className="w-4 h-4" style={{ color: muted }} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(ev) => {
                    const f = ev.target.files?.[0]; if (!f || !active) return;
                    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                    const kind = ["png","jpg","jpeg","webp","gif"].includes(ext) ? "image" as const : ext === "pdf" ? "pdf" as const : "medical" as const;
                    const d = addDoc({ name: f.name, kind, size: f.size, sharedWith: [active] });
                    addMessage({ threadId: active, from: "me", text: `📎 Shared ${d.name}` });
                    setTick(x => x + 1);
                    ev.target.value = "";
                  }}
                />
              </label>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" className="flex-1 rounded-full px-4 py-2 text-[13.5px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
              <button onClick={send} className="shrink-0 rounded-full px-3 py-2" style={{ background: ink, color: "#fff" }}><Send className="w-4 h-4" /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <div className="font-serif text-[20px]" style={{ color: ink }}>Pick a conversation</div>
              <p className="text-[13px]" style={{ color: muted }}>Messages are asynchronous. Your counsellor will reply within their listed window.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function pickAutoReply() {
  const options = [
    "Thanks for the message — I'll bring this up in our next session.",
    "Noting this. Take care until we speak next.",
    "Appreciate you sharing that. Try the box breathing if it gets loud tonight.",
    "Good to hear from you. We'll unpack this properly on our call.",
  ];
  return options[Math.floor(Math.random() * options.length)];
}
