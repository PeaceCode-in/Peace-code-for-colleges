import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { BUDDIES, avatarFor, listSessions, favorites, getBuddy } from "@/lib/buddies-store";
import { ArrowRight, Heart, Sparkles, ShieldAlert, Info, Users, Clock, Star } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/buddies/")({
  head: () => ({ meta: [
    { title: "Peace Buddies — PeaceCode" },
    { name: "description", content: "Talk to a trained student peer listener. Not therapy. Just someone who gets it." },
  ]}),
  component: BuddiesHome,
});

function BuddiesHome() {
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;
  const sessions = listSessions();
  const cont = useMemo(
    () => sessions.find((s) => s.status === "active" || s.status === "accepted" || s.status === "waiting" || s.status === "rescheduled"),
    [sessions]
  );
  const upcoming = sessions
    .filter((s) => s.scheduledFor && s.scheduledFor > Date.now() && ["waiting","accepted","rescheduled"].includes(s.status))
    .sort((a,b)=>(a.scheduledFor??0)-(b.scheduledFor??0))
    .slice(0, 3);
  const featured = BUDDIES.filter((b) => b.rating >= 4.8).slice(0, 3);
  const active = BUDDIES.filter((b) => b.online).slice(0, 4);
  const rec = BUDDIES.find((b) => favorites().includes(b.id)) ?? BUDDIES[0];

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col gap-1.5 mb-8">
          <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: muted }}>peace buddies · peer support</div>
          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight" style={{ color: ink }}>
            Trained students. <em className="italic opacity-80">Real conversations.</em>
          </h1>
          <p className="text-[15px] max-w-2xl mt-2" style={{ color: muted }}>
            Not therapists. Not a bot. Just peers who&apos;ve been trained to listen — and who&apos;ve probably been where you are.
          </p>
        </div>

        {/* action row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Link to="/buddies/browse" className="rounded-2xl p-4 flex items-center justify-between transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
            <div><div className="font-serif text-[15px]" style={{ color: ink }}>Find a buddy</div><div className="text-[11px]" style={{ color: muted }}>Browse · filter · search</div></div>
            <ArrowRight className="w-4 h-4 opacity-50"/>
          </Link>
          <Link to="/buddies/about" className="rounded-2xl p-4 flex items-center justify-between transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
            <div><div className="font-serif text-[15px]" style={{ color: ink }}>What is this?</div><div className="text-[11px]" style={{ color: muted }}>Peer vs counsellor vs therapist</div></div>
            <Info className="w-4 h-4 opacity-50"/>
          </Link>
          <Link to="/buddies/groups" className="rounded-2xl p-4 flex items-center justify-between transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
            <div><div className="font-serif text-[15px]" style={{ color: ink }}>Peer groups</div><div className="text-[11px]" style={{ color: muted }}>Circles · study · check-ins</div></div>
            <Users className="w-4 h-4 opacity-50"/>
          </Link>
          <Link to="/buddies/emergency" className="rounded-2xl p-4 flex items-center justify-between transition hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, var(--pc-lavender), var(--pc-soft))", border: `1px solid ${border}` }}>
            <div><div className="font-serif text-[15px]" style={{ color: ink }}>Emergency help</div><div className="text-[11px]" style={{ color: muted }}>Always one tap away</div></div>
            <ShieldAlert className="w-4 h-4" style={{ color: primary }}/>
          </Link>
        </div>

        {/* continue */}
        {cont && (
          <section className="rounded-3xl p-5 lg:p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: `linear-gradient(120deg, ${soft}, ${lavender})`, border: `1px solid ${border}` }}>
            <img src={avatarFor(cont.buddyId)} alt="" className="w-14 h-14 rounded-2xl" style={{ background: surface }}/>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">
                {cont.status === "active" ? "continue conversation" :
                 cont.status === "accepted" ? "your buddy is ready" :
                 cont.status === "rescheduled" ? "new time proposed" : "request pending"}
              </div>
              <div className="font-serif text-[19px] leading-tight" style={{ color: ink }}>{getBuddy(cont.buddyId)?.name}</div>
              <div className="text-[12px]" style={{ color: muted }}>
                {cont.status === "active" ? `active now · ${cont.messages.length} messages` :
                 cont.status === "accepted" ? "tap to open chat" :
                 cont.status === "rescheduled" ? "review their proposed time" : "waiting for response"}
              </div>
            </div>
            {cont.status === "active" || cont.status === "accepted" ? (
              <Link to="/buddies/chat/$id" params={{ id: cont.id }} className="px-5 py-2.5 rounded-full text-[12px] font-medium" style={{ background: ink, color: surface }}>open chat</Link>
            ) : (
              <Link to="/buddies/request/$id" params={{ id: cont.id }} className="px-5 py-2.5 rounded-full text-[12px] font-medium" style={{ background: ink, color: surface }}>view request</Link>
            )}
          </section>
        )}

        {/* Featured */}
        <SectionHeader title="Featured buddies" subtitle="Highly rated · verified" href="/buddies/browse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {featured.map((b) => <BuddyCard key={b.id} id={b.id}/>)}
        </div>

        {/* Recommended */}
        <SectionHeader title="Recommended for you" subtitle="Based on your recent activity" />
        <div className="rounded-3xl p-5 lg:p-7 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5" style={{ background: surface, border: `1px solid ${border}` }}>
          <img src={avatarFor(rec.id)} className="w-24 h-24 rounded-3xl" style={{ background: surface2 }} alt=""/>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">a good match today</div>
            <div className="font-serif text-[22px] leading-tight" style={{ color: ink }}>{rec.name}</div>
            <div className="text-[12px] mt-0.5" style={{ color: muted }}>{rec.course} · {rec.college}</div>
            <p className="text-[13px] mt-2 italic" style={{ color: ink, opacity: 0.75 }}>&ldquo;{rec.bio}&rdquo;</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {rec.specializations.slice(0, 4).map((s) => (
                <span key={s} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: surface2, color: muted }}>{s}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/buddies/$id" params={{ id: rec.id }} className="px-5 py-2.5 rounded-full text-[12px] text-center" style={{ background: ink, color: surface }}>view profile</Link>
            <Link to="/buddies/guidelines/$id" params={{ id: rec.id }} className="px-5 py-2.5 rounded-full text-[12px] text-center" style={{ background: surface2, color: ink }}>start chat</Link>
          </div>
        </div>

        {/* Recently active */}
        <SectionHeader title="Recently active" subtitle="Online now · quick to respond" href="/buddies/browse"/>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {active.map((b) => <BuddyCard key={b.id} id={b.id} compact/>)}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <SectionHeader title="Your upcoming sessions" href="/buddies/history"/>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {upcoming.map((s) => {
                const b = getBuddy(s.buddyId);
                const to = s.status === "accepted" ? "/buddies/chat/$id" : "/buddies/request/$id";
                return (
                  <Link key={s.id} to={to} params={{ id: s.id }} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
                    <img src={avatarFor(s.buddyId)} className="w-11 h-11 rounded-xl" alt=""/>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-[14px] truncate" style={{ color: ink }}>{b?.name}</div>
                      <div className="text-[11px] flex items-center gap-1" style={{ color: muted }}>
                        <Clock className="w-3 h-3"/>
                        {new Date(s.scheduledFor!).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div className="text-[9.5px] uppercase tracking-[0.2em] mt-0.5" style={{ color: muted }}>{s.status}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="rounded-3xl p-6 lg:p-8 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
          <Heart className="w-5 h-5 mx-auto mb-3" style={{ color: primary }}/>
          <h3 className="font-serif text-[22px] mb-1" style={{ color: ink }}>Every buddy is a real student.</h3>
          <p className="text-[13px] mb-4" style={{ color: muted }}>Verified, trained in active listening, and bound by confidentiality.</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Link to="/buddies/browse" className="px-5 py-2 rounded-full text-[12px]" style={{ background: ink, color: surface }}>Browse all buddies</Link>
            <Link to="/buddies/about" className="px-5 py-2 rounded-full text-[12px]" style={{ background: surface2, color: ink }}>Learn how this works</Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  const { muted, ink } = palette;
  return (
    <div className="flex items-end justify-between mb-4">
      <div><h2 className="font-serif text-[22px] leading-tight" style={{ color: ink }}>{title}</h2>
        {subtitle && <div className="text-[11px] mt-0.5" style={{ color: muted }}>{subtitle}</div>}
      </div>
      {href && <Link to={href} className="text-[11px] flex items-center gap-1" style={{ color: muted }}>see all <ArrowRight className="w-3 h-3"/></Link>}
    </div>
  );
}

export function BuddyCard({ id, compact = false }: { id: string; compact?: boolean }) {
  const { surface, surface2, border, ink, muted, primary } = palette;
  const b = getBuddy(id); if (!b) return null;
  return (
    <Link to="/buddies/$id" params={{ id: b.id }} className="rounded-2xl p-4 flex flex-col gap-3 transition hover:-translate-y-0.5"
      style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-start gap-3">
        <div className="relative"><img src={avatarFor(b.id)} className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} alt=""/>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ background: b.online ? "#22c55e" : "#a1a1aa", borderColor: surface }}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1"><span className="font-serif text-[15px] truncate" style={{ color: ink }}>{b.name}</span>
            {b.verified && <Sparkles className="w-3 h-3" style={{ color: primary }}/>}</div>
          <div className="text-[11px] truncate" style={{ color: muted }}>{b.course} · {b.year}</div>
          <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: muted }}>
            <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" fill="currentColor"/> {b.rating}</span>
            <span>·</span><span>{b.sessions} sessions</span>
          </div>
        </div>
      </div>
      {!compact && <p className="text-[12px] italic line-clamp-2" style={{ color: ink, opacity: 0.7 }}>&ldquo;{b.bio}&rdquo;</p>}
      <div className="flex flex-wrap gap-1">
        {b.specializations.slice(0, compact ? 2 : 3).map((s) => (
          <span key={s} className="text-[9.5px] px-2 py-0.5 rounded-full" style={{ background: surface2, color: muted }}>{s}</span>
        ))}
      </div>
    </Link>
  );
}
