import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Section, Chip, rupee, fmtDay, fmtTime } from "./counselling";
import {
  EXPERTS, upcomingAppointments, myCounsellors, listHomework, listGoals, RESOURCES,
  seedIfEmpty, photoFor, nextAvailable, getExpert,
} from "@/lib/counselling-store";
import { ArrowRight, Sparkles, ShieldCheck, Star, CalendarClock, MessageCircle, LifeBuoy, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/counselling/")({
  component: CounsellingHome,
});

function CounsellingHome() {
  const { ink, muted, primary, surface2, border, lavender, soft } = palette;
  const [tick, setTick] = useState(0);
  useEffect(() => { seedIfEmpty(); const t = setInterval(() => setTick(x=>x+1), 60_000); return () => clearInterval(t); }, []);

  const next = useMemo(() => upcomingAppointments()[0], [tick]);
  const nextExpert = next ? getExpert(next.expertId) : null;
  const seen = myCounsellors();
  const homework = listHomework().filter(h => !h.done).slice(0, 3);
  const goals = listGoals().slice(0, 4);
  const recommended = useMemo(() => {
    // Recommended: college partner, verified, high rating not already booked
    const seenIds = new Set(seen.map(e => e.id));
    return EXPERTS.filter(e => !seenIds.has(e.id) && e.collegePartner && e.rating >= 4.7).slice(0, 3);
  }, [seen]);
  const suggested = recommended[0] ?? EXPERTS[0];
  const suggestedNext = nextAvailable(suggested.id);

  // Simple AI-style summary derived from local state
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (next) parts.push(`Your next session is ${fmtDay(next.scheduledFor).toLowerCase()} at ${fmtTime(next.scheduledFor)}.`);
    if (homework.length) parts.push(`You have ${homework.length} open ${homework.length === 1 ? "task" : "tasks"} from your counsellor.`);
    if (goals.length) parts.push(`Your wellness plan has ${goals.length} active goals.`);
    if (parts.length === 0) parts.push("A quiet start. When you're ready, meet a counsellor who fits.");
    return parts.join(" ");
  }, [tick, next, homework.length, goals.length]);

  return (
    <>
      {/* Welcome */}
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: muted }}>Counselling</div>
        <h1 className="font-serif text-[34px] sm:text-[42px] leading-[1.05]" style={{ color: ink }}>
          Care that meets you where you are.
        </h1>
        <p className="mt-2 max-w-xl text-[15px]" style={{ color: muted }}>
          Verified psychologists for Indian college students. Book, prepare, meet, and follow up — all in one calm place.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/counselling/experts" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px]" style={{ background: ink, color: "#fff" }}>
            Find an expert <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/counselling/wellness" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
            <Sparkles className="w-4 h-4" /> Wellness plan
          </Link>
          <Link to="/counselling/emergency" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px]" style={{ background: "#fff1f0", color: "#9a1c1c", border: "1px solid #f6c9c4" }}>
            <LifeBuoy className="w-4 h-4" /> I need help now
          </Link>
        </div>
      </div>

      {/* AI summary + upcoming */}
      <div className="grid gap-4 sm:grid-cols-5 mb-8">
        <Card className="sm:col-span-3" style={{ background: `linear-gradient(180deg, ${lavender} 0%, ${soft} 100%)` }}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: muted }}>
            <Sparkles className="w-3.5 h-3.5" /> AI summary
          </div>
          <p className="mt-2 font-serif text-[19px] leading-snug" style={{ color: ink }}>{summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/counselling/homework" className="text-[12.5px] underline underline-offset-2" style={{ color: ink }}>Open tasks</Link>
            <span style={{ color: muted }}>·</span>
            <Link to="/counselling/reports" className="text-[12.5px] underline underline-offset-2" style={{ color: ink }}>Progress trends</Link>
            <span style={{ color: muted }}>·</span>
            <Link to="/counselling/messages" className="text-[12.5px] underline underline-offset-2" style={{ color: ink }}>Messages</Link>
          </div>
        </Card>

        <Card className="sm:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: muted }}>Next session</div>
          {next && nextExpert ? (
            <>
              <div className="flex items-center gap-3">
                <img src={photoFor(nextExpert.id)} alt="" className="w-12 h-12 rounded-2xl" style={{ background: surface2 }} />
                <div className="min-w-0">
                  <div className="font-serif text-[17px] truncate" style={{ color: ink }}>{nextExpert.name}</div>
                  <div className="text-[12px]" style={{ color: muted }}>{fmtDay(next.scheduledFor)} · {fmtTime(next.scheduledFor)} · {next.mode}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/counselling/upcoming" className="flex-1 rounded-full px-3 py-2 text-center text-[12.5px]" style={{ background: ink, color: "#fff" }}>Open dashboard</Link>
                <Link to="/counselling/messages" className="rounded-full px-3 py-2 text-[12.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}><MessageCircle className="w-4 h-4" /></Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px]" style={{ color: muted }}>No sessions on the calendar yet. When you're ready, we'll help you find someone who fits.</p>
              <Link to="/counselling/experts" className="mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px]" style={{ background: ink, color: "#fff" }}>
                Browse experts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </Card>
      </div>

      {/* Continue care */}
      {seen.length > 0 && (
        <Section eyebrow="Continue care" title="Your counsellors" action={<Link to="/counselling/my" className="text-[12.5px]" style={{ color: muted }}>See all</Link>}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seen.slice(0, 3).map(e => (
              <Card key={e.id}>
                <div className="flex items-center gap-3">
                  <img src={photoFor(e.id)} alt="" className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} />
                  <div className="min-w-0">
                    <div className="font-serif text-[17px] truncate" style={{ color: ink }}>{e.name}</div>
                    <div className="text-[12px]" style={{ color: muted }}>{e.title}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.specializations.slice(0, 2).map(s => <Chip key={s}>{s}</Chip>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to="/counselling/expert/$id" params={{ id: e.id }} className="flex-1 rounded-full px-3 py-2 text-center text-[12.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Profile</Link>
                  <Link to="/counselling/book/$id" params={{ id: e.id }} className="flex-1 rounded-full px-3 py-2 text-center text-[12.5px]" style={{ background: ink, color: "#fff" }}>Book again</Link>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Recommended */}
      <Section eyebrow="Recommended for you" title="Counsellors who fit your college life" action={<Link to="/counselling/experts" className="text-[12.5px]" style={{ color: muted }}>Browse all</Link>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map(e => {
            const next = nextAvailable(e.id);
            return (
              <Link key={e.id} to="/counselling/expert/$id" params={{ id: e.id }} className="block">
                <Card className="h-full transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <img src={photoFor(e.id)} alt="" className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="font-serif text-[17px] truncate" style={{ color: ink }}>{e.name}</div>
                        {e.verified && <ShieldCheck className="w-3.5 h-3.5" style={{ color: primary }} />}
                      </div>
                      <div className="text-[12px]" style={{ color: muted }}>{e.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: muted }}>
                        <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3" style={{ color: "#c99a2a" }} /> {e.rating.toFixed(1)}</span>
                        <span>·</span><span>{e.experienceYears} yrs</span>
                        <span>·</span><span>{rupee(e.fees)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {e.specializations.slice(0, 3).map(s => <Chip key={s}>{s}</Chip>)}
                  </div>
                  {next && (
                    <div className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: muted }}>
                      <CalendarClock className="w-3.5 h-3.5" /> Next slot {next.label} · {next.slot}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Progress + resources */}
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: muted }}>My progress</div>
              <div className="font-serif text-[19px]" style={{ color: ink }}>Wellness plan</div>
            </div>
            <Link to="/counselling/wellness" className="text-[12.5px]" style={{ color: muted }}>Open plan</Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-[13.5px]" style={{ color: muted }}>Your counsellor will build a plan with you after your first session.</p>
          ) : (
            <div className="space-y-3">
              {goals.map(g => (
                <div key={g.id}>
                  <div className="flex justify-between text-[12.5px] mb-1" style={{ color: muted }}>
                    <span style={{ color: ink }}>{g.title}</span><span>{g.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surface2 }}>
                    <div style={{ width: `${g.progress}%`, height: "100%", background: primary, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: muted }}>Recent resources</div>
              <div className="font-serif text-[19px]" style={{ color: ink }}>Short reads and practices</div>
            </div>
            <Link to="/counselling/resources" className="text-[12.5px]" style={{ color: muted }}>All resources</Link>
          </div>
          <div className="space-y-2">
            {RESOURCES.slice(0, 4).map(r => (
              <Link key={r.id} to="/counselling/resources" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-black/[0.02]" style={{ border: `1px solid ${border}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: surface2 }}>
                  <Play className="w-4 h-4" style={{ color: ink }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] truncate" style={{ color: ink }}>{r.title}</div>
                  <div className="text-[11.5px]" style={{ color: muted }}>{r.kind} · {r.minutes ? `${r.minutes} min` : "PDF"} · {r.topic}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Book someone new */}
      <Card style={{ background: `linear-gradient(180deg, ${soft} 0%, #fff 100%)` }}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <img src={photoFor(suggested.id)} alt="" className="w-16 h-16 rounded-2xl" style={{ background: surface2 }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: muted }}>Recommended counsellor</div>
            <div className="font-serif text-[20px]" style={{ color: ink }}>Try {suggested.name.split(" ").slice(-1)[0]} this week</div>
            <div className="text-[13px] mt-0.5" style={{ color: muted }}>
              {suggested.specializations.slice(0, 3).join(" · ")} {suggestedNext ? ` · Next slot ${suggestedNext.label} at ${suggestedNext.slot}` : ""}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/counselling/expert/$id" params={{ id: suggested.id }} className="rounded-full px-4 py-2 text-[12.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>View profile</Link>
            <Link to="/counselling/book/$id" params={{ id: suggested.id }} className="rounded-full px-4 py-2 text-[12.5px]" style={{ background: ink, color: "#fff" }}>Book session</Link>
          </div>
        </div>
      </Card>
    </>
  );
}
