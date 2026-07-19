import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import {
  getSession, getBuddy, avatarFor, simulateBuddyResponse,
  acceptProposal, respondToRequest, cancelSession, upcomingSlots,
} from "@/lib/buddies-store";
import { ArrowLeft, Clock, Check, X, CalendarClock, MessageCircle, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/buddies/request/$id")({
  head: () => ({ meta: [{ title: "Request sent — Peace Buddies" }] }),
  component: RequestPage,
});

function fmt(ts?: number) {
  if (!ts) return "flexible time";
  return new Date(ts).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function RequestPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

  const [session, setSession] = useState(() => getSession(id));
  const [elapsed, setElapsed] = useState(0);

  const b = session ? getBuddy(session.buddyId) : null;

  // Simulate a buddy response after ~4-8 seconds.
  useEffect(() => {
    if (!session || session.status !== "waiting") return;
    const wait = 4000 + (session.id.length % 5) * 800;
    const t = setTimeout(() => { simulateBuddyResponse(session.id); setSession(getSession(session.id)); }, wait);
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { clearTimeout(t); clearInterval(tick); };
  }, [session]);

  // Auto-forward once accepted (small pause so the user sees confirmation).
  useEffect(() => {
    if (session?.status === "accepted") {
      const t = setTimeout(() => navigate({ to: "/buddies/chat/$id", params: { id: session.id } }), 1400);
      return () => clearTimeout(t);
    }
  }, [session?.status, session?.id, navigate]);

  if (!session || !b) {
    return (
      <AppShell>
        <main className="max-w-lg mx-auto p-10 text-center">
          <p style={{ color: muted }}>We couldn&apos;t find that request.</p>
          <Link to="/buddies" className="underline text-[12px]">back to peace buddies</Link>
        </main>
      </AppShell>
    );
  }

  const cancel = () => { cancelSession(session.id); navigate({ to: "/buddies" }); };
  const acceptCounter = () => { acceptProposal(session.id); setSession(getSession(session.id)); };
  const declineCounter = () => { respondToRequest(session.id, "decline", { reason: "student declined new time" }); setSession(getSession(session.id)); };

  const alts = upcomingSlots(b.id, 14, 6).filter((s) => s.ts !== session.scheduledFor);

  return (
    <AppShell>
      <main className="max-w-xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <section className="rounded-3xl p-7 lg:p-8 mb-6 flex flex-col items-center text-center"
          style={{ background: `linear-gradient(140deg, ${soft}, ${lavender})`, border: `1px solid ${border}` }}>
          <img src={avatarFor(b.id)} className="w-20 h-20 rounded-3xl mb-4" style={{ background: surface }} alt=""/>
          <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: muted }}>
            {session.status === "waiting" && "request sent"}
            {session.status === "accepted" && "request accepted"}
            {session.status === "declined" && "request declined"}
            {session.status === "rescheduled" && "new time proposed"}
            {session.status === "cancelled" && "request cancelled"}
          </div>
          <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.2rem)] leading-tight mt-1" style={{ color: ink }}>
            {session.status === "waiting" && <>Waiting for <em className="italic opacity-80">{b.name.split(" ")[0]}</em></>}
            {session.status === "accepted" && <>{b.name.split(" ")[0]} said yes.</>}
            {session.status === "declined" && <>{b.name.split(" ")[0]} can&apos;t take this one.</>}
            {session.status === "rescheduled" && <>{b.name.split(" ")[0]} suggested another time.</>}
            {session.status === "cancelled" && <>You cancelled this request.</>}
          </h1>

          {session.status === "waiting" && (
            <>
              <p className="text-[13px] mt-2 max-w-md" style={{ color: muted }}>
                Peer buddies usually reply in {b.responseMin} minutes or less. We&apos;ll open the chat as soon as they accept.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full" style={{ background: surface, color: ink }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }}/>
                listening · {String(Math.floor(elapsed/60)).padStart(2,"0")}:{String(elapsed%60).padStart(2,"0")}
              </div>
            </>
          )}

          {session.status === "accepted" && (
            <p className="text-[13px] mt-2" style={{ color: muted }}>Opening your chat…</p>
          )}
        </section>

        {/* Summary */}
        <section className="rounded-3xl p-5 mb-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: muted }}>Your request</div>
          <Row label="When" value={session.slotLabel ?? fmt(session.scheduledFor)} icon={Clock}/>
          {session.topic && <Row label="Topic" value={session.topic}/>}
          {session.language && <Row label="Language" value={session.language}/>}
          {session.duration && <Row label="Duration" value={`${session.duration} min`}/>}
          {session.goal && <Row label="Goal" value={session.goal}/>}
        </section>

        {/* Buddy rescheduled */}
        {session.status === "rescheduled" && session.proposedFor && (
          <section className="rounded-3xl p-5 mb-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-start gap-3 mb-3">
              <CalendarClock className="w-4 h-4 mt-0.5" style={{ color: primary }}/>
              <div>
                <div className="font-serif text-[15px]" style={{ color: ink }}>{b.name.split(" ")[0]} proposed a new time</div>
                <div className="text-[12px]" style={{ color: muted }}>They&apos;re busy at your original slot. Here&apos;s their next opening:</div>
              </div>
            </div>
            <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: surface2 }}>
              <div className="font-serif text-[19px]" style={{ color: ink }}>{fmt(session.proposedFor)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={declineCounter} className="flex-1 py-2.5 rounded-full text-[12px]" style={{ background: surface2, color: ink }}>No thanks</button>
              <button onClick={acceptCounter} className="flex-1 py-2.5 rounded-full text-[12px] flex items-center justify-center gap-1.5" style={{ background: ink, color: surface }}>
                <Check className="w-3.5 h-3.5"/> Accept new time
              </button>
            </div>
          </section>
        )}

        {/* Declined — offer alternatives */}
        {session.status === "declined" && (
          <section className="rounded-3xl p-5 mb-6" style={{ background: surface, border: `1px solid ${border}` }}>
            {session.declineReason && (
              <p className="text-[12.5px] italic mb-4" style={{ color: ink, opacity: 0.75 }}>&ldquo;{session.declineReason}&rdquo;</p>
            )}
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: muted }}>you have options</div>
            <div className="flex flex-col gap-2">
              <Link to="/buddies/browse" className="px-4 py-3 rounded-2xl text-[12.5px] flex items-center justify-between" style={{ background: surface2, color: ink }}>
                Try another buddy <ArrowLeft className="w-3.5 h-3.5 rotate-180 opacity-50"/>
              </Link>
              <Link to="/buddies/book/$id" params={{ id: b.id }} className="px-4 py-3 rounded-2xl text-[12.5px] flex items-center justify-between" style={{ background: surface2, color: ink }}>
                Book {b.name.split(" ")[0]} for later <ArrowLeft className="w-3.5 h-3.5 rotate-180 opacity-50"/>
              </Link>
              <Link to="/buddies/groups" className="px-4 py-3 rounded-2xl text-[12.5px] flex items-center justify-between" style={{ background: surface2, color: ink }}>
                Join a peer group <ArrowLeft className="w-3.5 h-3.5 rotate-180 opacity-50"/>
              </Link>
            </div>
          </section>
        )}

        {/* Actions while waiting */}
        {session.status === "waiting" && (
          <div className="flex gap-2 mb-6">
            <button onClick={cancel} className="flex-1 py-3 rounded-full text-[12px] flex items-center justify-center gap-1.5" style={{ background: surface2, color: ink }}>
              <X className="w-3.5 h-3.5"/> Cancel request
            </button>
            <button onClick={()=>{ simulateBuddyResponse(session.id); setSession(getSession(session.id)); }}
              className="flex-1 py-3 rounded-full text-[12px] flex items-center justify-center gap-1.5" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
              <RefreshCcw className="w-3.5 h-3.5"/> Check status
            </button>
          </div>
        )}

        {session.status === "accepted" && (
          <Link to="/buddies/chat/$id" params={{ id: session.id }}
            className="w-full py-3 rounded-full text-[12.5px] flex items-center justify-center gap-2" style={{ background: ink, color: surface }}>
            <MessageCircle className="w-4 h-4"/> Open chat
          </Link>
        )}

        {/* Alternate slots always visible when declined/rescheduled */}
        {(session.status === "declined" || session.status === "rescheduled") && alts.length > 0 && (
          <section className="mt-6">
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: muted }}>other times with {b.name.split(" ")[0]}</div>
            <div className="grid grid-cols-2 gap-2">
              {alts.slice(0, 4).map((a) => (
                <Link key={a.ts} to="/buddies/book/$id" params={{ id: b.id }} className="rounded-2xl p-3 text-[11.5px]" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                  <div className="text-[9px] uppercase tracking-[0.2em] opacity-60">{a.label}</div>
                  <div className="font-serif text-[15px] mt-0.5">{a.slot}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  const { muted, ink } = palette;
  return (
    <div className="flex items-center justify-between text-[13px] py-2">
      <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: muted }}>{label}</span>
      <span className="flex items-center gap-1.5" style={{ color: ink }}>{Icon && <Icon className="w-3 h-3 opacity-50"/>}{value}</span>
    </div>
  );
}
