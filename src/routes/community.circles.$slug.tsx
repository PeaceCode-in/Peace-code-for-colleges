import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Users, Radio, Feather, Plus, Check, Hash, Sparkles } from "lucide-react";
import { cmy } from "@/lib/community-theme";
import { community, useCommunity, timeAgo } from "@/lib/community-store";

export const Route = createFileRoute("/community/circles/$slug")({
  component: CircleDetail,
  loader: ({ params }) => {
    const c = community.getCircleBySlug(params.slug);
    if (!c) throw notFound();
    return { slug: params.slug };
  },
  notFoundComponent: () => (
    <main className="max-w-[720px] mx-auto px-6 py-16 text-center">
      <div className="font-serif text-[26px]">this circle isn't here.</div>
      <Link to="/community/circles" className="mt-4 inline-block text-[12px] tracking-[0.24em] uppercase" style={{ color: cmy.primary }}>← back to circles</Link>
    </main>
  ),
});

function CircleDetail() {
  const { slug } = Route.useParams();
  const { circles, rooms, joinedCircles } = useCommunity();
  const circle = circles.find((c) => c.slug === slug)!;
  const threads = community.threadsInCircle(slug);
  const relatedRooms = rooms.filter((r) => r.circleSlug === slug);
  const joined = joinedCircles.includes(slug);

  return (
    <main className="relative z-10 max-w-[1080px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-24">
      <Link to="/community/circles" className="flex items-center gap-2 text-[11.5px] mb-6" style={{ color: cmy.muted }}>
        <ArrowLeft className="w-4 h-4" strokeWidth={1.6}/> back to circles
      </Link>

      {/* hero */}
      <section className="relative overflow-hidden rounded-[32px] p-8 lg:p-10 mb-8"
               style={{ background: `linear-gradient(160deg, ${cmy.surface} 0%, ${cmy.surface2} 100%)`, border: `1px solid ${cmy.border}` }}>
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-70"
             style={{ background: `radial-gradient(circle, ${circle.accent}, transparent 70%)` }}/>
        <div className="relative flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase mb-5" style={{ color: cmy.muted }}>
          <Hash className="w-3 h-3" strokeWidth={1.6}/> {circle.tag}
        </div>
        <h1 className="relative font-serif text-[clamp(2rem,5.4vw,3.6rem)] leading-[1.02] tracking-tight max-w-[720px]">{circle.name}</h1>
        <p className="relative mt-4 max-w-[620px] text-[14px] leading-relaxed" style={{ color: cmy.muted }}>{circle.description}</p>

        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <button onClick={() => community.toggleJoin(slug)}
                  className="h-11 px-5 rounded-full flex items-center gap-2 text-[12.5px] transition hover:-translate-y-0.5"
                  style={{ background: joined ? cmy.surface : cmy.ink, color: joined ? cmy.ink : "#F7FAFF", border: `1px solid ${joined ? cmy.border : cmy.ink}` }}>
            {joined ? <><Check className="w-4 h-4"/> joined · {circle.members} kin</> : <><Users className="w-4 h-4"/> join · {circle.members} kin</>}
          </button>
          <Link to="/community/new" search={{ circle: slug } as any}
                className="h-11 px-4 rounded-full flex items-center gap-2 text-[12.5px]"
                style={{ background: cmy.surface, color: cmy.ink, border: `1px solid ${cmy.border}` }}>
            <Plus className="w-4 h-4"/> offer a thread
          </Link>
          <div className="ml-auto flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase" style={{ color: cmy.muted }}>
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#66C39A", opacity: 0.6 }}/>
              <span className="relative rounded-full w-2 h-2" style={{ background: "#66C39A" }}/>
            </span>
            {circle.live} here now
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* threads in circle */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Feather className="w-4 h-4" strokeWidth={1.6} style={{ color: cmy.primary }}/>
            <span className="font-serif text-[18px]">threads in this circle</span>
            <span className="text-[10px] tracking-[0.24em] uppercase ml-1" style={{ color: cmy.muted }}>{threads.length}</span>
          </div>
          {threads.length === 0 ? (
            <div className="rounded-[22px] p-6 text-[13px]" style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.muted }}>
              no threads yet. be the first to leave a small letter.
              <div className="mt-4"><Link to="/community/new" search={{ circle: slug } as any}
                                          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-[12.5px]"
                                          style={{ background: cmy.ink, color: "#F7FAFF" }}>
                <Plus className="w-3.5 h-3.5"/> offer a thread
              </Link></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {threads.map((t) => (
                <Link key={t.id} to={`/community/threads/${t.id}`}
                      className="group rounded-[22px] p-5 transition hover:-translate-y-0.5"
                      style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
                  <div className="text-[10px] tracking-[0.24em] uppercase" style={{ color: cmy.muted }}>
                    {t.author} · {timeAgo(t.createdAt)}
                  </div>
                  <h3 className="mt-2 font-serif text-[19px] leading-snug tracking-tight">{t.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed line-clamp-2" style={{ color: cmy.muted }}>{t.body}</p>
                  <div className="mt-3 flex items-center gap-4 text-[11px]" style={{ color: cmy.muted }}>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> {t.votes} warmth</span>
                    <span className="ml-auto transition group-hover:translate-x-0.5" style={{ color: cmy.ink }}>open →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* related live rooms */}
        <aside className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4" strokeWidth={1.6} style={{ color: cmy.primary }}/>
            <span className="font-serif text-[16px]">rooms nearby</span>
          </div>
          {relatedRooms.length === 0 && (
            <div className="rounded-[20px] p-5 text-[12.5px]" style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.muted }}>
              no live rooms right now.
            </div>
          )}
          {relatedRooms.map((r) => (
            <Link key={r.id} to={`/community/rooms/${r.id}`}
                  className="group rounded-[20px] p-5 transition hover:-translate-y-0.5"
                  style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color: cmy.muted }}>
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#EF6B6B", opacity: 0.6 }}/>
                  <span className="relative rounded-full w-2 h-2" style={{ background: "#EF6B6B" }}/>
                </span>
                live · {r.tag}
              </div>
              <div className="font-serif text-[17px] leading-tight">{r.name}</div>
              <div className="mt-2 text-[11.5px]" style={{ color: cmy.muted }}>{r.listeners} listening →</div>
            </Link>
          ))}
        </aside>
      </div>
    </main>
  );
}
