import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles, Radio, Feather, Users, ChevronRight, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import logo from "@/assets/peacecode-logo.png";
import { cmy } from "@/lib/community-theme";
import { useCommunity, timeAgo } from "@/lib/community-store";

export const Route = createFileRoute("/community/")({ component: CommunityHome });

function CommunityHome() {
  const { circles, rooms, threads } = useCommunity();
  const [q, setQ] = useState("");

  const searchHits = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return [
      ...circles.filter((c) => (c.name + c.description + c.tag).toLowerCase().includes(s))
        .map((c) => ({ kind: "circle" as const, to: `/community/circles/${c.slug}`, title: c.name, meta: `${c.members} kin · ${c.tag}` })),
      ...rooms.filter((r) => (r.name + r.topic + r.tag).toLowerCase().includes(s))
        .map((r) => ({ kind: "room" as const, to: `/community/rooms/${r.id}`, title: r.name, meta: `${r.listeners} listening · ${r.tag}` })),
      ...threads.filter((t) => (t.title + t.body).toLowerCase().includes(s))
        .map((t) => ({ kind: "thread" as const, to: `/community/threads/${t.id}`, title: t.title, meta: `${t.votes} warmth · ${timeAgo(t.createdAt)}` })),
    ].slice(0, 8);
  }, [q, circles, rooms, threads]);

  const featuredCircles = circles.slice(0, 3);
  const liveNow = rooms.slice(0, 2);
  const warmThreads = [...threads].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const totalListening = rooms.reduce((sum, r) => sum + r.listeners, 0);

  return (
    <main className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-24">
      {/* hero */}
      <section className="relative mb-10 lg:mb-14">
        <div className="text-[8px] sm:text-[9px] tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-3 sm:mb-4" style={{ color: cmy.muted }}>
          the circle · {rooms.length} rooms live · {totalListening} quietly listening
        </div>
        <h1 className="font-serif font-medium tracking-tight leading-[1.01] sm:leading-[0.98] text-[clamp(1.85rem,8.6vw,4.6rem)] max-w-[900px]">
          nobody heals alone. <span style={{ color: cmy.primary, fontStyle: "italic" }}>even in silence, we're here.</span>
        </h1>
        <p className="mt-4 sm:mt-6 max-w-[560px] text-[13px] sm:text-[14px] leading-relaxed" style={{ color: cmy.muted }}>
          circles are small rooms for the same feeling. live rooms are voices held together. threads are quiet letters, left open for someone else to find.
        </p>

        {/* search */}
        <div className="relative mt-6 sm:mt-8 max-w-[620px]">
          <div className="flex items-center gap-2 h-11 rounded-full px-4"
               style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
            <Search className="w-4 h-4" strokeWidth={1.5} style={{ color: cmy.muted }}/>
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="search a feeling, a circle, a thread…"
                   className="flex-1 bg-transparent outline-none text-[13px] placeholder:opacity-60"
                   style={{ color: cmy.ink }}/>
          </div>
          {searchHits.length > 0 && (
            <div className="absolute z-20 top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden shadow-lg"
                 style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
              {searchHits.map((h) => (
                <Link key={h.kind + h.to} to={h.to}
                      className="flex items-center gap-3 px-4 py-3 text-[13px] transition hover:bg-[--h]"
                      style={{ ["--h" as any]: cmy.surface2, borderBottom: `1px solid ${cmy.border}` }}>
                  <span className="text-[9.5px] tracking-[0.28em] uppercase w-14 shrink-0" style={{ color: cmy.muted }}>{h.kind}</span>
                  <span className="flex-1 truncate">{h.title}</span>
                  <span className="text-[10.5px]" style={{ color: cmy.muted }}>{h.meta}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* three-column overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7">

        {/* circles column */}
        <section>
          <SectionHeader icon={Users} title="circles" to="/community/circles" hint={`${circles.length} rooms of feeling`} />
          <div className="flex flex-col gap-3">
            {featuredCircles.map((c, i) => (
              <Link key={c.slug} to={`/community/circles/${c.slug}`}
                    className="group relative overflow-hidden rounded-[22px] p-5 transition hover:-translate-y-0.5"
                    style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-70"
                     style={{ background: `radial-gradient(circle, ${c.accent}, transparent 70%)` }}/>
                <div className="relative text-[10px] tracking-[0.3em] uppercase" style={{ color: cmy.muted }}>0{i + 1} · #{c.tag}</div>
                <h3 className="relative mt-2 font-serif text-[22px] leading-tight tracking-tight">{c.name}</h3>
                <p className="relative mt-2 text-[12.5px] leading-relaxed line-clamp-2" style={{ color: cmy.muted }}>{c.description}</p>
                <div className="relative mt-3 flex items-center justify-between text-[11px]" style={{ color: cmy.muted }}>
                  <span>{c.members} kin · {c.live} here now</span>
                  <span className="flex items-center gap-1 transition group-hover:translate-x-0.5" style={{ color: cmy.ink }}>enter <ChevronRight className="w-3 h-3"/></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* rooms column */}
        <section>
          <SectionHeader icon={Radio} title="live rooms" to="/community/rooms" hint={`${rooms.length} live`} />
          <div className="flex flex-col gap-3">
            {liveNow.map((r) => (
              <Link key={r.id} to={`/community/rooms/${r.id}`}
                    className="group relative overflow-hidden rounded-[22px] p-5 transition hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(160deg, ${cmy.surface} 0%, ${cmy.surface2} 100%)`, border: `1px solid ${cmy.border}` }}>
                <div className="flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#EF6B6B", opacity: 0.6 }}/>
                    <span className="relative rounded-full w-2 h-2" style={{ background: "#EF6B6B" }}/>
                  </span>
                  live · {r.tag}
                </div>
                <h3 className="font-serif text-[20px] leading-tight tracking-tight">{r.name}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed line-clamp-2" style={{ color: cmy.muted }}>{r.topic}</p>
                <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: cmy.muted }}>
                  <span>{r.host}</span>
                  <span style={{ color: cmy.ink }}>{r.listeners} listening →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* threads column */}
        <section>
          <SectionHeader icon={Feather} title="warm threads" to="/community/threads" hint={`${threads.length} letters`} />
          <div className="flex flex-col gap-3">
            {warmThreads.map((t) => {
              const circle = circles.find((c) => c.slug === t.circleSlug);
              return (
                <Link key={t.id} to={`/community/threads/${t.id}`}
                      className="group rounded-[22px] p-5 transition hover:-translate-y-0.5"
                      style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
                  <div className="text-[10px] tracking-[0.24em] uppercase" style={{ color: cmy.muted }}>
                    {circle?.name ?? "circle"} · {t.author} · {timeAgo(t.createdAt)}
                  </div>
                  <h3 className="mt-2 font-serif text-[18px] leading-snug tracking-tight line-clamp-3">{t.title}</h3>
                  <div className="mt-3 flex items-center gap-4 text-[11px]" style={{ color: cmy.muted }}>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> {t.votes} warmth</span>
                    <span className="ml-auto transition group-hover:translate-x-0.5" style={{ color: cmy.ink }}>open →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* pact banner */}
      <section className="relative overflow-hidden rounded-[28px] mt-10 lg:mt-14 p-7 lg:p-10"
               style={{ background: `linear-gradient(160deg, ${cmy.lavender}, ${cmy.sky})`, border: `1px solid ${cmy.border}` }}>
        <div className="flex items-center gap-2 text-[10.5px] tracking-[0.32em] uppercase mb-4" style={{ color: cmy.ink }}>
          <Waves className="w-4 h-4" strokeWidth={1.5}/> a small pact
        </div>
        <p className="font-serif text-[clamp(1.2rem,2.4vw,1.9rem)] leading-snug max-w-[720px]" style={{ color: cmy.ink }}>
          here, we don't fix each other. we just <em>stay</em>. no advice unless asked. no pressure to be brave.
        </p>
        <img src={logo} alt="" className="absolute -bottom-6 -right-6 w-32 h-32 opacity-30"/>
      </section>
    </main>
  );
}

function SectionHeader({ icon: Icon, title, to, hint }: { icon: any; title: string; to: string; hint: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" strokeWidth={1.6} style={{ color: cmy.primary }}/>
        <span className="font-serif text-[18px]" style={{ color: cmy.ink }}>{title}</span>
        <span className="text-[10px] tracking-[0.24em] uppercase ml-1" style={{ color: cmy.muted }}>{hint}</span>
      </div>
      <Link to={to} className="text-[11px] tracking-[0.22em] uppercase transition hover:translate-x-0.5" style={{ color: cmy.muted }}>see all →</Link>
    </div>
  );
}
