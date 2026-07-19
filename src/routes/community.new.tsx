import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { cmy } from "@/lib/community-theme";
import { useCommunity, community } from "@/lib/community-store";

type Search = { circle?: string };

export const Route = createFileRoute("/community/new")({
  component: NewThreadPage,
  validateSearch: (search: Record<string, unknown>): Search => ({
    circle: typeof search.circle === "string" ? search.circle : undefined,
  }),
});

function NewThreadPage() {
  const { circle: circleFromSearch } = useSearch({ from: "/community/new" });
  const { circles } = useCommunity();
  const navigate = useNavigate();
  const [circleSlug, setCircleSlug] = useState(circleFromSearch ?? circles[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const canPost = title.trim().length > 0 && circleSlug;

  const submit = () => {
    if (!canPost) return;
    const id = community.createThread({ title, body, circleSlug });
    navigate({ to: `/community/threads/${id}` });
  };

  return (
    <main className="relative z-10 max-w-[720px] mx-auto px-5 lg:px-10 pt-6 lg:pt-8 pb-24">
      <Link to="/community" className="flex items-center gap-2 text-[12px] mb-6" style={{ color: cmy.muted }}>
        <ArrowLeft className="w-4 h-4" strokeWidth={1.6}/> back to the circle
      </Link>

      <div className="rounded-[28px] p-7 lg:p-10 relative overflow-hidden"
           style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full blur-3xl opacity-40"
             style={{ background: `radial-gradient(circle, ${cmy.lavender}, transparent 70%)` }}/>
        <div className="relative text-[9.5px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>offer a thread · anonymous</div>
        <h1 className="relative font-serif text-[clamp(1.6rem,4vw,2.4rem)] tracking-tight leading-[1.05]">what would you like to leave here?</h1>
        <p className="relative mt-3 text-[13px] leading-relaxed max-w-[500px]" style={{ color: cmy.muted }}>
          a sentence is enough. you don't have to be brave. you don't have to be finished.
        </p>

        <div className="relative mt-8 flex flex-col gap-4">
          <div>
            <label className="text-[10px] tracking-[0.28em] uppercase" style={{ color: cmy.muted }}>which circle</label>
            <select value={circleSlug} onChange={(e) => setCircleSlug(e.target.value)}
                    className="mt-2 w-full h-11 px-4 rounded-full text-[13px] outline-none"
                    style={{ background: cmy.surface2, color: cmy.ink, border: `1px solid ${cmy.border}` }}>
              {circles.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] tracking-[0.28em] uppercase" style={{ color: cmy.muted }}>a soft title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
                   placeholder="one line, in your own words…"
                   className="mt-2 w-full h-12 px-5 rounded-full text-[14px] outline-none"
                   style={{ background: cmy.surface2, color: cmy.ink, border: `1px solid ${cmy.border}` }}/>
          </div>

          <div>
            <label className="text-[10px] tracking-[0.28em] uppercase" style={{ color: cmy.muted }}>and, if you want, more</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6}
                      placeholder="a paragraph, a list, a memory. optional."
                      className="mt-2 w-full px-5 py-4 rounded-3xl text-[14px] leading-relaxed resize-none outline-none"
                      style={{ background: cmy.surface2, color: cmy.ink, border: `1px solid ${cmy.border}` }}/>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10.5px]" style={{ color: cmy.muted }}>posting as <em>anonymous · leaf</em></span>
            <button onClick={submit} disabled={!canPost}
                    className="h-11 px-5 rounded-full flex items-center gap-2 text-[12.5px] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{ background: cmy.ink, color: "#F7FAFF", boxShadow: "0 12px 24px -12px rgba(29,42,68,0.5)" }}>
              <Send className="w-3.5 h-3.5" strokeWidth={1.7}/> offer thread
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
