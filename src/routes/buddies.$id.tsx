import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { getBuddy, avatarFor, toggleFavorite, favorites, toggleBlock, blocked } from "@/lib/buddies-store";
import { ArrowLeft, Sparkles, Star, MessageCircle, Calendar, Play, Flag, Share2, Heart, Ban, Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/buddies/$id")({
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const b = getBuddy(id);
  const navigate = useNavigate();
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;
  const [fav, setFav] = useState(favorites().includes(id));
  const [isBlocked, setIsBlocked] = useState(blocked().includes(id));
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!b) return (
    <AppShell><main className="max-w-3xl mx-auto p-10 text-center">
      <p style={{ color: palette.muted }}>Buddy not found.</p>
      <Link to="/buddies/browse" className="text-[12px] underline mt-3 inline-block">browse all buddies</Link>
    </main></AppShell>
  );

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies/browse" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back to browse
        </Link>

        {/* Hero */}
        <section className="rounded-3xl p-6 lg:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center gap-6"
          style={{ background: `linear-gradient(120deg, ${soft}, ${lavender})`, border: `1px solid ${border}` }}>
          <img src={avatarFor(b.id)} className="w-28 h-28 md:w-32 md:h-32 rounded-3xl" style={{ background: surface }} alt=""/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-tight" style={{ color: ink }}>{b.name}</h1>
              {b.verified && <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: surface, color: primary }}>
                <Sparkles className="w-2.5 h-2.5"/> verified</span>}
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: surface, color: muted }}>{b.gender}</span>
            </div>
            <div className="text-[13px] mt-1" style={{ color: muted }}>{b.course} · {b.year} · {b.college}</div>
            <div className="flex items-center gap-3 mt-3 text-[11px]" style={{ color: ink }}>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" fill="currentColor" style={{ color: primary }}/> {b.rating}</span>
              <span className="opacity-40">·</span>
              <span>{b.sessions} sessions</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> replies in ~{b.responseMin}m</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: b.online ? "#22c55e" : "#a1a1aa" }}/> {b.online ? "online" : "offline"}</span>
            </div>

            <div className="flex gap-2 mt-5 flex-wrap">
              <Link to="/buddies/guidelines/$id" params={{ id: b.id }} className="px-4 py-2 rounded-full text-[12px] flex items-center gap-1.5" style={{ background: ink, color: surface }}>
                <MessageCircle className="w-3.5 h-3.5"/> Chat
              </Link>
              <Link to="/buddies/book/$id" params={{ id: b.id }} className="px-4 py-2 rounded-full text-[12px] flex items-center gap-1.5" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
                <Calendar className="w-3.5 h-3.5"/> Book session
              </Link>
              <button onClick={()=>{ toggleFavorite(b.id); setFav(favorites().includes(b.id)); }}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }} aria-label="favorite">
                <Heart className="w-3.5 h-3.5" fill={fav ? "currentColor" : "none"} style={{ color: fav ? primary : muted }}/>
              </button>
              <button onClick={()=>{ navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false), 1500); }}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }} aria-label="share">
                <Share2 className="w-3.5 h-3.5" style={{ color: muted }}/>
              </button>
              <button onClick={()=>setShowReport(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }} aria-label="report">
                <Flag className="w-3.5 h-3.5" style={{ color: muted }}/>
              </button>
            </div>
            {copied && <div className="text-[10px] mt-2" style={{ color: primary }}>link copied</div>}
          </div>
        </section>

        {/* Intro video placeholder */}
        <section className="rounded-3xl mb-6 aspect-[16/6] flex items-center justify-center relative overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 40%, ${soft}, transparent 60%), radial-gradient(circle at 70% 60%, ${lavender}, transparent 60%)` }}/>
          <div className="relative flex flex-col items-center gap-2">
            <button className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: ink, color: surface }} onClick={()=>alert("Intro video coming soon 🎥")}>
              <Play className="w-5 h-5" fill="currentColor"/>
            </button>
            <div className="text-[11px]" style={{ color: muted }}>60-second intro from {b.name.split(" ")[0]}</div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* About */}
          <section className="lg:col-span-2 rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="font-serif text-[18px] mb-2" style={{ color: ink }}>About</h2>
            <p className="text-[13px] italic mb-4" style={{ color: ink, opacity: 0.8 }}>&ldquo;{b.bio}&rdquo;</p>
            <div className="grid sm:grid-cols-2 gap-4 text-[12px]" style={{ color: ink }}>
              <Field label="Support style">{b.supportStyle}</Field>
              <Field label="Experience">{b.experienceYears} years</Field>
              <Field label="Languages">{b.languages.join(" · ")}</Field>
              <Field label="Interests">{b.interests.join(" · ")}</Field>
              <Field label="Hobbies">{b.hobbies.join(" · ")}</Field>
            </div>
          </section>

          {/* Weekly */}
          <section className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="font-serif text-[18px] mb-3" style={{ color: ink }}>Weekly schedule</h2>
            <div className="space-y-1.5">
              {days.map((d) => (
                <div key={d} className="flex items-center gap-3 text-[11.5px]">
                  <span className="w-8 opacity-60">{d}</span>
                  {b.weekly[d]?.length ? (
                    <div className="flex gap-1 flex-wrap">
                      {b.weekly[d]!.map((s) => <span key={s} className="px-2 py-0.5 rounded-full" style={{ background: surface2, color: ink }}>{s}</span>)}
                    </div>
                  ) : <span className="opacity-40">unavailable</span>}
                </div>
              ))}
            </div>
            <Link to="/buddies/book/$id" params={{ id: b.id }} className="mt-4 block text-center py-2 rounded-full text-[11px]" style={{ background: surface2, color: ink }}>
              view full availability →
            </Link>
          </section>
        </div>

        {/* Support topics */}
        <section className="rounded-3xl p-6 mb-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="font-serif text-[18px] mb-3" style={{ color: ink }}>Supports</h2>
          <div className="flex flex-wrap gap-1.5">
            {b.topics.map((t) => (
              <span key={t} className="text-[11px] px-3 py-1 rounded-full" style={{ background: surface2, color: ink }}>{t}</span>
            ))}
          </div>
        </section>

        {/* Reviews & Achievements */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <section className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="font-serif text-[18px] mb-3" style={{ color: ink }}>Student reviews</h2>
            <div className="space-y-3">
              {b.reviews.map((r, i) => (
                <div key={i} className="rounded-2xl p-3" style={{ background: surface2 }}>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: primary }}>
                    {Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="w-2.5 h-2.5" fill="currentColor"/>)}
                    <span className="opacity-50 ml-1">{r.by}</span>
                  </div>
                  <p className="text-[12px] mt-1 italic" style={{ color: ink }}>&ldquo;{r.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <h2 className="font-serif text-[18px] mb-3" style={{ color: ink }}>Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {b.achievements.map((a) => (
                <span key={a} className="text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: surface2, color: ink }}>
                  <Sparkles className="w-3 h-3" style={{ color: primary }}/> {a}
                </span>
              ))}
            </div>
            <button onClick={()=>{ toggleBlock(b.id); setIsBlocked(blocked().includes(b.id)); }}
              className="mt-6 text-[11px] flex items-center gap-1.5" style={{ color: isBlocked ? primary : muted }}>
              <Ban className="w-3 h-3"/> {isBlocked ? "unblock" : "block this buddy"}
            </button>
          </section>
        </div>

        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={()=>setShowReport(false)}>
            <div className="max-w-md w-full rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e)=>e.stopPropagation()}>
              <h3 className="font-serif text-[18px] mb-3" style={{ color: ink }}>Report {b.name}</h3>
              <p className="text-[12px] mb-3" style={{ color: muted }}>Reports are reviewed within 24 hours. Immediate danger? Use emergency help instead.</p>
              <div className="flex flex-col gap-2">
                {["Harassment","Spam","Unsafe advice","Inappropriate behaviour","Fake profile","Emergency concern"].map((r) => (
                  <button key={r} onClick={()=>{ alert(`Report submitted: ${r}. Our team will review.`); setShowReport(false); navigate({ to: "/buddies" }); }}
                    className="text-left px-4 py-3 rounded-2xl text-[12.5px]" style={{ background: surface2, color: ink }}>{r}</button>
                ))}
              </div>
              <button onClick={()=>setShowReport(false)} className="w-full mt-3 py-2 text-[11px]" style={{ color: muted }}>cancel</button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { muted } = palette;
  return <div><div className="text-[9.5px] tracking-[0.25em] uppercase mb-0.5" style={{ color: muted }}>{label}</div><div>{children}</div></div>;
}
