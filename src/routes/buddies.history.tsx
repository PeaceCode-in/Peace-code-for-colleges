import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { listSessions, getBuddy, avatarFor, favorites, BUDDIES } from "@/lib/buddies-store";
import { ArrowLeft, Star, Clock, Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/buddies/history")({
  head: () => ({ meta: [{ title: "Session history & favorites" }] }),
  component: History,
});

function History() {
  const { surface, surface2, border, ink, muted, primary } = palette;
  const sessions = listSessions();
  const favs = favorites();
  const favBuddies = BUDDIES.filter((b) => favs.includes(b.id));
  const recentBuddies = Array.from(new Set(sessions.map((s) => s.buddyId))).map(getBuddy).filter(Boolean).slice(0, 6);

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-1" style={{ color: ink }}>Your history</h1>
        <p className="text-[13px] mb-8" style={{ color: muted }}>Every conversation lives here — quietly, privately.</p>

        {/* Achievements strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-10">
          {[
            { title: "First conversation", val: sessions.length >= 1 },
            { title: "Support seeker", val: sessions.length >= 3 },
            { title: "Weekly check-in", val: sessions.length >= 5 },
            { title: "Growth journey", val: sessions.length >= 10 },
            { title: "Community member", val: favs.length >= 3 },
          ].map((a) => (
            <div key={a.title} className="rounded-2xl p-3 text-center" style={{ background: surface, border: `1px solid ${border}`, opacity: a.val ? 1 : 0.4 }}>
              <div className="text-[18px]">{a.val ? "🌱" : "⚪"}</div>
              <div className="text-[10px] mt-1" style={{ color: muted }}>{a.title}</div>
            </div>
          ))}
        </div>

        {/* Favorites */}
        {favBuddies.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-[19px] mb-3" style={{ color: ink }}>Favorite buddies</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {favBuddies.map((b) => (
                <Link key={b.id} to="/buddies/$id" params={{ id: b.id }} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
                  <img src={avatarFor(b.id)} className="w-11 h-11 rounded-xl" alt=""/>
                  <div className="min-w-0"><div className="font-serif text-[13px] truncate" style={{ color: ink }}>{b.name}</div>
                    <div className="text-[10px] flex items-center gap-1" style={{ color: muted }}><Heart className="w-2.5 h-2.5" fill="currentColor" style={{ color: primary }}/> saved</div></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Buddies */}
        {recentBuddies.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-[19px] mb-3" style={{ color: ink }}>Recent buddies</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentBuddies.map((b) => b && (
                <Link key={b.id} to="/buddies/$id" params={{ id: b.id }} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
                  <img src={avatarFor(b.id)} className="w-11 h-11 rounded-xl" alt=""/>
                  <div><div className="font-serif text-[13px]" style={{ color: ink }}>{b.name}</div>
                    <div className="text-[10px]" style={{ color: muted }}>{b.course}</div></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sessions */}
        <h2 className="font-serif text-[19px] mb-3" style={{ color: ink }}>Conversations</h2>
        {sessions.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
            <p className="font-serif text-[16px] mb-2" style={{ color: ink }}>No conversations yet</p>
            <p className="text-[12px] mb-4" style={{ color: muted }}>Every buddy remembers this feeling. Start when you&apos;re ready.</p>
            <Link to="/buddies/browse" className="inline-block px-5 py-2 rounded-full text-[12px]" style={{ background: ink, color: surface }}>Find a buddy</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const b = getBuddy(s.buddyId); if (!b) return null;
              const to = s.status === "completed" ? "/buddies/$id" : "/buddies/chat/$id";
              const params = s.status === "completed" ? { id: b.id } : { id: s.id };
              return (
                <Link key={s.id} to={to as "/buddies/chat/$id"} params={params as { id: string }} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
                  <img src={avatarFor(b.id)} className="w-12 h-12 rounded-2xl" alt=""/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-serif text-[14px]" style={{ color: ink }}>{b.name}</span>
                      <span className="text-[9.5px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full" style={{ background: surface2, color: muted }}>{s.status}</span></div>
                    <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: muted }}>
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5"/> {new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      <span>·</span><span>{s.messages.length} msgs</span>
                      {s.topic && <><span>·</span><span>{s.topic}</span></>}
                    </div>
                    {s.moodBefore && s.moodAfter && (
                      <div className="text-[10.5px] mt-1" style={{ color: muted }}>mood {s.moodBefore} → {s.moodAfter}</div>
                    )}
                  </div>
                  {s.rating ? (
                    <div className="flex items-center gap-0.5" style={{ color: primary }}>
                      {Array.from({ length: s.rating }).map((_,i)=><Star key={i} className="w-3 h-3" fill="currentColor"/>)}
                    </div>
                  ) : <MessageCircle className="w-4 h-4 opacity-40"/>}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
