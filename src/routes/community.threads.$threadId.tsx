import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, MessageCircle, Bookmark, Send, Heart } from "lucide-react";
import { cmy } from "@/lib/community-theme";
import { community, useCommunity, timeAgo } from "@/lib/community-store";

export const Route = createFileRoute("/community/threads/$threadId")({
  component: ThreadDetail,
  loader: ({ params }) => {
    const t = community.getThread(params.threadId);
    if (!t) throw notFound();
    return { id: params.threadId };
  },
  notFoundComponent: () => (
    <main className="max-w-[720px] mx-auto px-6 py-16 text-center">
      <div className="font-serif text-[26px]">this thread has drifted.</div>
      <Link to="/community/threads" className="mt-4 inline-block text-[12px] tracking-[0.24em] uppercase" style={{ color: cmy.primary }}>← back to threads</Link>
    </main>
  ),
});

function ThreadDetail() {
  const { threadId } = Route.useParams();
  const { threads, circles, savedThreadIds } = useCommunity();
  const thread = threads.find((t) => t.id === threadId)!;
  const circle = circles.find((c) => c.slug === thread.circleSlug);
  const comments = community.commentsFor(threadId);
  const isSaved = savedThreadIds.includes(threadId);

  const [reply, setReply] = useState("");

  const submit = () => {
    if (!reply.trim()) return;
    community.addComment(threadId, reply);
    setReply("");
  };

  return (
    <main className="relative z-10 max-w-[820px] mx-auto px-5 lg:px-10 pt-6 lg:pt-8 pb-24">
      <Link to="/community/threads" className="flex items-center gap-2 text-[12px] mb-6" style={{ color: cmy.muted }}>
        <ArrowLeft className="w-4 h-4" strokeWidth={1.6}/> back to threads
      </Link>

      <article className="relative rounded-[32px] p-7 lg:p-12 overflow-hidden"
               style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40"
             style={{ background: `radial-gradient(circle, ${circle?.accent ?? cmy.lavender}, transparent 70%)` }}/>

        <div className="relative flex items-center gap-2 text-[10.5px] tracking-[0.28em] uppercase mb-5 flex-wrap" style={{ color: cmy.muted }}>
          {circle ? (
            <Link to={`/community/circles/${circle.slug}`} className="rounded-full px-2.5 py-1 hover:-translate-y-0.5 transition inline-block"
                  style={{ background: cmy.surface2, color: cmy.ink }}>{circle.name}</Link>
          ) : <span className="rounded-full px-2.5 py-1" style={{ background: cmy.surface2, color: cmy.ink }}>{thread.circleSlug}</span>}
          <span>·</span><span>{thread.author}</span><span>·</span><span>{timeAgo(thread.createdAt)}</span>
        </div>
        <h1 className="relative font-serif text-[clamp(1.7rem,4vw,3rem)] leading-[1.05] tracking-tight max-w-[680px]">{thread.title}</h1>
        {thread.body && (
          <p className="relative mt-6 text-[15px] leading-[1.75] max-w-[620px] whitespace-pre-line" style={{ color: cmy.ink }}>{thread.body}</p>
        )}

        <div className="relative mt-10 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full h-11 px-2" style={{ background: cmy.surface2 }}>
            <button onClick={() => community.voteThread(threadId, 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: cmy.ink }}>
              <ArrowUp className="w-4 h-4" strokeWidth={1.8}/>
            </button>
            <span className="font-serif text-[15px] min-w-[32px] text-center" style={{ color: cmy.ink }}>{thread.votes}</span>
            <button onClick={() => community.voteThread(threadId, -1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: cmy.ink }}>
              <ArrowDown className="w-4 h-4" strokeWidth={1.8}/>
            </button>
          </div>
          <button className="h-11 px-4 rounded-full flex items-center gap-2 text-[12.5px]" style={{ background: cmy.surface2, color: cmy.ink }}>
            <MessageCircle className="w-4 h-4" strokeWidth={1.6}/> {comments.length} held it
          </button>
          <button onClick={() => community.toggleSave(threadId)}
                  className="h-11 px-4 rounded-full flex items-center gap-2 text-[12.5px]"
                  style={{ background: isSaved ? cmy.ink : cmy.surface2, color: isSaved ? "#F7FAFF" : cmy.ink }}>
            <Bookmark className="w-4 h-4" strokeWidth={1.6} fill={isSaved ? "#F7FAFF" : "transparent"}/> {isSaved ? "kept" : "keep"}
          </button>
        </div>
      </article>

      {/* composer */}
      <div className="mt-10 rounded-[24px] p-6" style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
        <div className="text-[10px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>hold this thread</div>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
                  placeholder="a sentence is enough. we're not looking for advice, just company."
                  className="w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none"
                  style={{ color: cmy.ink }}/>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10.5px]" style={{ color: cmy.muted }}>posting as <em>anonymous · leaf</em></span>
          <button onClick={submit}
                  className="h-10 px-5 rounded-full flex items-center gap-2 text-[12.5px] transition hover:-translate-y-0.5 disabled:opacity-50"
                  disabled={!reply.trim()}
                  style={{ background: cmy.ink, color: "#F7FAFF" }}>
            <Send className="w-3.5 h-3.5" strokeWidth={1.7}/> offer
          </button>
        </div>
      </div>

      {/* comments */}
      <div className="mt-10 flex flex-col gap-4">
        {comments.length === 0 && (
          <div className="rounded-[20px] p-6 text-[13px] text-center" style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.muted }}>
            no one has held this yet. you could be the first.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-[20px] p-5" style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
            <div className="flex items-center gap-2 text-[10.5px] tracking-[0.24em] uppercase" style={{ color: cmy.muted }}>
              <span style={{ color: cmy.ink }}>{c.who}</span> · {timeAgo(c.createdAt)}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: cmy.ink }}>{c.text}</p>
            <div className="mt-3 flex items-center gap-4 text-[11.5px]" style={{ color: cmy.muted }}>
              <button onClick={() => community.voteComment(c.id, 1)} className="flex items-center gap-1 transition hover:text-[color:var(--i)]" style={{ ["--i" as any]: cmy.ink }}>
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.6}/> {c.votes}
              </button>
              <button onClick={() => community.toggleHold(c.id)} className="flex items-center gap-1 transition"
                      style={{ color: c.held ? "#EF6B6B" : cmy.muted }}>
                <Heart className="w-3.5 h-3.5" strokeWidth={1.6} fill={c.held ? "#EF6B6B" : "none"}/> hold
              </button>
              <button onClick={() => setReply((r) => (r ? r + " " : "") + `@${c.who} `)} className="transition hover:text-[color:var(--i)]" style={{ ["--i" as any]: cmy.ink }}>reply</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
