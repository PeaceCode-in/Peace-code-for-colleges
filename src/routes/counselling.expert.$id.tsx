import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip, rupee } from "./counselling";
import { getExpert, photoFor, upcomingSlots, favorites, toggleFavorite } from "@/lib/counselling-store";
import { useState, useMemo } from "react";
import { ShieldCheck, Star, Heart, MessageCircle, Share2, Flag, ArrowLeft, CalendarClock, Play, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/counselling/expert/$id")({
  component: ExpertProfile,
});

function ExpertProfile() {
  const { id } = useParams({ from: "/counselling/expert/$id" });
  const e = getExpert(id);
  const { ink, muted, primary, surface, surface2, border, soft, lavender } = palette;
  const [tab, setTab] = useState<"about" | "reviews" | "faqs">("about");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [fav, setFav] = useState(favorites().includes(id));

  const grouped = useMemo(() => {
    if (!e) return {} as Record<string, { slot: string; ts: number }[]>;
    const slots = upcomingSlots(id, 14, 60);
    const by: Record<string, { slot: string; ts: number }[]> = {};
    slots.forEach(s => { (by[s.label] ??= []).push({ slot: s.slot, ts: s.ts }); });
    return by;
  }, [id, e]);

  if (!e) {
    return (
      <Card className="text-center py-16">
        <div className="font-serif text-[22px]" style={{ color: ink }}>We couldn't find that counsellor.</div>
        <Link to="/counselling/experts" className="inline-block mt-3 rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>Back to search</Link>
      </Card>
    );
  }

  return (
    <>
      <Link to="/counselling/experts" className="inline-flex items-center gap-1.5 text-[12.5px] mb-3" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to experts
      </Link>

      {/* Hero */}
      <Card className="mb-4" pad={false} style={{ background: `linear-gradient(180deg, ${lavender} 0%, ${surface} 60%)` }}>
        <div className="p-4 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-6">
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden flex-none" style={{ background: surface2 }}>
            <img src={photoFor(e.id)} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className="font-serif text-[24px] sm:text-[28px] leading-tight" style={{ color: ink }}>{e.name}</h1>
                  {e.verified && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]" style={{ background: "#eaf1ff", color: "#26468f" }}><ShieldCheck className="w-3 h-3" /> Verified</span>}
                </div>
                <div className="text-[13.5px]" style={{ color: muted }}>{e.title} · {e.qualification}</div>
                <div className="text-[12px] mt-0.5" style={{ color: muted }}>{e.license} · {e.experienceYears} years of practice</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => { toggleFavorite(e.id); setFav(!fav); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}>
                  <Heart className="w-4 h-4" style={{ color: fav ? "#c14a5a" : muted, fill: fav ? "#c14a5a" : "transparent" }} />
                </button>
                <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }} aria-label="Share"><Share2 className="w-4 h-4" style={{ color: muted }} /></button>
                <button onClick={() => alert("Thanks — our team will review.")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }} aria-label="Report"><Flag className="w-4 h-4" style={{ color: muted }} /></button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-[12.5px]" style={{ color: muted }}>
              <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5" style={{ color: "#c99a2a" }} /> {e.rating.toFixed(1)} ({e.reviewsCount} reviews)</span>
              <span>·</span><span>{e.sessions.toLocaleString("en-IN")} sessions</span>
              <span>·</span><span>Responds in ~{e.responseMin} min</span>
              <span>·</span><span>{e.gender} · {e.ageGroups.join(", ")}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.specializations.map(s => <Chip key={s}>{s}</Chip>)}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/counselling/book/$id" params={{ id: e.id }} className="rounded-full px-5 py-2.5 text-[13.5px] inline-flex items-center gap-2" style={{ background: ink, color: "#fff" }}>Book session · {rupee(e.fees)}</Link>
              <Link to="/counselling/messages" className="rounded-full px-4 py-2.5 text-[13px] inline-flex items-center gap-2" style={{ background: surface, color: ink, border: `1px solid ${border}` }}><MessageCircle className="w-4 h-4" /> Message</Link>
            </div>
          </div>
        </div>

        {/* Intro video placeholder */}
        <div className="relative mx-4 sm:mx-8 mb-5 sm:mb-6 rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/6]" style={{ background: `linear-gradient(135deg, ${soft}, ${lavender})` }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px]" style={{ background: "rgba(255,255,255,0.85)", color: ink, border: `1px solid ${border}` }}>
              <Play className="w-4 h-4" /> Watch intro (1:20)
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <Card pad={false}>
            <div className="flex gap-1 p-2" style={{ borderBottom: `1px solid ${border}` }}>
              {(["about","reviews","faqs"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className="rounded-full px-4 py-1.5 text-[12.5px]"
                  style={{ background: tab === t ? ink : "transparent", color: tab === t ? "#fff" : muted }}>
                  {t === "about" ? "About" : t === "reviews" ? `Reviews (${e.reviewsCount})` : "FAQs"}
                </button>
              ))}
            </div>
            <div className="p-5 sm:p-6">
              {tab === "about" && (
                <div className="space-y-4 text-[14px]" style={{ color: ink }}>
                  <p className="font-serif text-[18px] leading-relaxed">{e.bio}</p>
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Approach</div>
                    <p style={{ color: muted }}>{e.approach}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Education</div>
                      <ul className="space-y-1 text-[13.5px]" style={{ color: ink }}>{e.education.map(x => <li key={x}>· {x}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Certificates</div>
                      <ul className="space-y-1 text-[13.5px]" style={{ color: ink }}>{e.certificates.map(x => <li key={x}>· {x}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Therapy types</div>
                      <div className="flex flex-wrap gap-1.5">{e.therapyTypes.map(t => <Chip key={t}>{t}</Chip>)}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Languages</div>
                      <div className="text-[13.5px]" style={{ color: ink }}>{e.languages.join(", ")}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Cancellation policy</div>
                    <p className="text-[13.5px]" style={{ color: muted }}>{e.cancellationPolicy}</p>
                  </div>
                </div>
              )}
              {tab === "reviews" && (
                <div className="space-y-3">
                  {e.reviews.map((r, i) => (
                    <div key={i} className="rounded-2xl p-4" style={{ background: surface2 }}>
                      <div className="flex items-center gap-2 text-[12px] mb-1" style={{ color: muted }}>
                        <span>{r.by}</span><span>·</span><span>{r.when}</span>
                        <span className="ml-auto inline-flex items-center gap-0.5"><Star className="w-3 h-3" style={{ color: "#c99a2a" }} /> {r.rating}.0</span>
                      </div>
                      <p className="text-[14px]" style={{ color: ink }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === "faqs" && (
                <div className="space-y-2">
                  {e.faqs.length === 0 && <p className="text-[13.5px]" style={{ color: muted }}>No FAQs yet.</p>}
                  {e.faqs.map((f, i) => (
                    <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="block w-full text-left rounded-2xl p-4" style={{ background: surface2 }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-serif text-[15.5px]" style={{ color: ink }}>{f.q}</div>
                        {openFaq === i ? <ChevronUp className="w-4 h-4" style={{ color: muted }} /> : <ChevronDown className="w-4 h-4" style={{ color: muted }} />}
                      </div>
                      {openFaq === i && <p className="mt-1.5 text-[13.5px]" style={{ color: muted }}>{f.a}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {e.successStories[0] && (
            <Card style={{ background: `linear-gradient(180deg, ${soft} 0%, ${surface} 100%)` }}>
              <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>What students say worked</div>
              <p className="font-serif text-[17px] leading-relaxed" style={{ color: ink }}>“{e.successStories[0]}”</p>
            </Card>
          )}
        </div>

        {/* Right column: booking card + calendar */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-baseline justify-between">
              <div className="font-serif text-[22px]" style={{ color: ink }}>{rupee(e.fees)}<span className="text-[13px]" style={{ color: muted }}> /session</span></div>
              <div className="text-[12px]" style={{ color: muted }}>{e.modes.join(" · ")}</div>
            </div>
            <div className="mt-3 space-y-1.5 text-[13px]" style={{ color: muted }}>
              <div>Session length · 45–60 min</div>
              <div>Responds in ~{e.responseMin} min</div>
              <div>{e.emergency ? "Available for emergency sessions" : "Not available for emergencies"}</div>
              <div>{e.collegePartner ? "College partner counsellor" : "Independent practice"}</div>
            </div>
            <Link to="/counselling/book/$id" params={{ id: e.id }} className="mt-4 flex items-center justify-center gap-2 rounded-full py-2.5 text-[13.5px]" style={{ background: ink, color: "#fff" }}>Book a session</Link>
          </Card>

          <Card>
            <div className="text-[10.5px] uppercase tracking-[0.18em] mb-2" style={{ color: muted }}>Next 14 days</div>
            <div className="space-y-3 max-h-none overflow-visible pr-0 sm:max-h-[420px] sm:overflow-y-auto sm:pr-1">
              {Object.entries(grouped).slice(0, 10).map(([day, slots]) => (
                <div key={day}>
                  <div className="flex items-center gap-1.5 text-[12.5px] mb-1" style={{ color: ink }}>
                    <CalendarClock className="w-3.5 h-3.5" style={{ color: primary }} /> {day}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {slots.map(s => (
                      <Link key={s.ts} to="/counselling/book/$id" params={{ id: e.id }} search={{ ts: s.ts }} className="rounded-full px-2.5 py-1 text-[11.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                        {s.slot}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(grouped).length === 0 && <p className="text-[13px]" style={{ color: muted }}>No open slots in the next two weeks.</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
