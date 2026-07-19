import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock, MapPin, Video, Users, Bookmark, BookmarkCheck, Share2, CalendarPlus, Flag, MessageCircle,
  ChevronRight, Sparkles, UserPlus, Check, Ban, ClipboardList, HelpCircle, ExternalLink,
} from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  Page, BackBar, Card, Chip, PrimaryBtn, GhostBtn, SectionHead, EventBanner, EventCard, EmptyState,
} from "@/components/events/primitives";
import {
  eventById, organizerById, statusOf, formatDateParts, isBookmarked, toggleBookmark,
  rsvpFor, setRsvp, clearRsvp, events,
} from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;

function EventDetail() {
  const { id } = Route.useParams();
  const e = eventById(id);
  const [bm, setBm] = useState(false);
  const [rsvp, setRsvpState] = useState<ReturnType<typeof rsvpFor>>();
  const [toast, setToast] = useState("");

  useEffect(() => {
    setBm(isBookmarked(id));
    setRsvpState(rsvpFor(id));
  }, [id]);

  if (!e) {
    return (
      <Page>
        <BackBar />
        <EmptyState title="Event not found" sub="It may have been removed or the link is old." cta={<Link to="/events/browse"><PrimaryBtn>Browse all events</PrimaryBtn></Link>} />
      </Page>
    );
  }

  const org = organizerById(e.organizerId)!;
  const status = statusOf(e);
  const { day, month, weekday, time } = formatDateParts(e.date);
  const spotsLeft = Math.max(0, e.capacity - e.registered);
  const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));

  const doRsvp = (s: "attend" | "maybe" | "not_interested" | "waitlist") => {
    setRsvp(id, s);
    setRsvpState(rsvpFor(id));
    setToast(s === "attend" ? "You're going! 🌿" : s === "maybe" ? "Marked as maybe." : s === "waitlist" ? "Added to waitlist." : "Marked not interested.");
    setTimeout(() => setToast(""), 1800);
  };

  const doShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: e.title, text: e.tagline, url });
      else { await navigator.clipboard.writeText(url); setToast("Link copied to clipboard."); setTimeout(() => setToast(""), 1800); }
    } catch {}
  };

  const doCalendar = () => {
    const dt = new Date(e.date);
    const end = new Date(dt.getTime() + e.durationMin * 60_000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PeaceCode//Events//EN",
      "BEGIN:VEVENT",
      `UID:${e.id}@peacecode`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(dt)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${e.title}`,
      `DESCRIPTION:${e.tagline}`,
      `LOCATION:${e.location}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${e.id}.ics`; a.click();
    URL.revokeObjectURL(url);
    setToast("Added to calendar."); setTimeout(() => setToast(""), 1800);
  };

  const similar = events.filter((x) => x.id !== e.id && x.category === e.category).slice(0, 3);

  const faqs = [
    { q: "Can I bring a friend?", a: "Yes — invite anyone from PeaceCode. Non-users are welcome as guests." },
    { q: "What if I can't make it?", a: "Cancel anytime from the event page — your spot goes to the waitlist." },
    { q: "Will it be recorded?", a: "Only if the organizer opts in. Live circles are never recorded." },
  ];

  return (
    <Page wide>
      <BackBar />

      {/* Hero */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-[28px] overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          <EventBanner e={e} className="h-[240px] sm:h-[320px]" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Chip tone="outline">{e.category}</Chip>
              {e.trending && <Chip tone="warm">Trending</Chip>}
              {e.featured && <Chip tone="warm"><Sparkles className="w-3 h-3"/>Featured</Chip>}
              <Chip tone="outline">{e.language}</Chip>
              <Chip tone="outline">{e.difficulty}</Chip>
              <Chip tone="outline">{e.free ? "Free" : (e.price ?? "Paid")}</Chip>
            </div>
            <h1 className="font-serif tracking-tight text-[28px] sm:text-[38px] leading-[1.05]" style={{ color: ink }}>{e.title}</h1>
            <p className="mt-3 text-[13.5px]" style={{ color: muted }}>{e.description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>When</div>
                <div className="font-serif text-[15.5px] mt-1" style={{ color: ink }}>{weekday}, {month} {day}</div>
                <div className="text-[12px]" style={{ color: muted }}>{time} · {e.durationMin} min</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Where</div>
                <div className="font-serif text-[15.5px] mt-1 flex items-center gap-1.5" style={{ color: ink }}>
                  {e.mode === "online" ? <Video className="w-4 h-4"/> : <MapPin className="w-4 h-4"/>} {e.mode[0].toUpperCase() + e.mode.slice(1)}
                </div>
                <div className="text-[12px]" style={{ color: muted }}>{e.location}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Seats</div>
                <div className="font-serif text-[15.5px] mt-1" style={{ color: ink }}>{e.registered} / {e.capacity}</div>
                <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: border }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primary }}/>
                </div>
                <div className="text-[11.5px] mt-1" style={{ color: muted }}>{spotsLeft} spots left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky action panel */}
        <div className="space-y-4">
          <Card>
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Your status</div>
            <div className="mt-2 font-serif text-[18px]" style={{ color: ink }}>
              {rsvp?.status === "attend" ? "You're going." :
               rsvp?.status === "maybe" ? "You said maybe." :
               rsvp?.status === "waitlist" ? "On the waitlist." :
               rsvp?.status === "not_interested" ? "Not this time." :
               "Not registered yet."}
            </div>

            <div className="mt-4 space-y-2">
              <Link to="/events/$id/rsvp" params={{ id: e.id }} className="block">
                <button className="w-full rounded-full h-11 text-[13px] tracking-wide inline-flex items-center justify-center gap-2 transition"
                  style={{ background: rsvp?.status === "attend" ? primary : ink, color: "#fff" }}>
                  {rsvp?.status === "attend" ? <><Check className="w-3.5 h-3.5"/> Registered — manage</> : <>RSVP now →</>}
                </button>
              </Link>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => doRsvp("maybe")} className="rounded-full h-10 text-[11.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Maybe</button>
                <button onClick={() => doRsvp("waitlist")} className="rounded-full h-10 text-[11.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Waitlist</button>
                <button onClick={() => doRsvp("not_interested")} className="rounded-full h-10 text-[11.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Skip</button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={doCalendar} className="rounded-full h-10 text-[11.5px] inline-flex items-center justify-center gap-1.5"
                  style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                  <CalendarPlus className="w-3.5 h-3.5"/> Add to calendar
                </button>
                <button onClick={() => { toggleBookmark(id); setBm(isBookmarked(id)); }} className="rounded-full h-10 text-[11.5px] inline-flex items-center justify-center gap-1.5"
                  style={{ background: bm ? soft : surface2, color: bm ? primary : ink, border: `1px solid ${border}` }}>
                  {bm ? <BookmarkCheck className="w-3.5 h-3.5"/> : <Bookmark className="w-3.5 h-3.5"/>} {bm ? "Saved" : "Bookmark"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={doShare} className="rounded-full h-10 text-[11.5px] inline-flex items-center justify-center gap-1.5"
                  style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                  <Share2 className="w-3.5 h-3.5"/> Share
                </button>
                <button onClick={doShare} className="rounded-full h-10 text-[11.5px] inline-flex items-center justify-center gap-1.5"
                  style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                  <UserPlus className="w-3.5 h-3.5"/> Invite
                </button>
              </div>

              {rsvp?.status === "attend" && (
                <button onClick={() => { clearRsvp(id); setRsvpState(undefined); setToast("Registration cancelled."); setTimeout(() => setToast(""), 1800); }}
                  className="mt-1 w-full rounded-full h-10 text-[11.5px] inline-flex items-center justify-center gap-1.5"
                  style={{ background: "transparent", color: "#c14545", border: `1px solid ${border}` }}>
                  <Ban className="w-3.5 h-3.5"/> Cancel registration
                </button>
              )}
            </div>

            {status === "live" && (
              <Link to="/events/$id/live" params={{ id: e.id }}
                className="mt-4 block rounded-2xl p-3 text-center text-[12.5px]"
                style={{ background: "linear-gradient(135deg, rgba(217,72,72,0.12), rgba(217,72,72,0.06))", color: "#c14545", border: "1px solid rgba(217,72,72,0.25)" }}>
                Live now — join the room →
              </Link>
            )}
          </Card>

          {/* Organizer summary */}
          <Card>
            <div className="text-[10.5px] uppercase tracking-wide mb-3" style={{ color: muted }}>Hosted by</div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-[15px] shrink-0"
                   style={{ background: soft, color: primary }}>{org.initials}</div>
              <div className="min-w-0">
                <div className="font-serif text-[16px]" style={{ color: ink }}>{org.name}</div>
                <div className="text-[11.5px]" style={{ color: muted }}>{org.role} · {org.org}</div>
                <div className="text-[11px] mt-1" style={{ color: muted }}>{org.college} · ⭐ {org.rating}</div>
                <Link to="/events/organizer/$oid" params={{ oid: org.id }}
                  className="mt-3 inline-flex items-center gap-1 text-[12px]" style={{ color: primary }}>
                  Organizer profile <ChevronRight className="w-3 h-3"/>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick links */}
          <Card padded={false}>
            <div className="p-4 pb-2 text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Related</div>
            {[
              { to: "/events/$id/chat" as const,       label: "Community chat", icon: MessageCircle },
              { to: "/events/$id/timeline" as const,   label: "Event timeline", icon: ClipboardList },
              { to: "/events/$id/attendance" as const, label: "Attendance", icon: Check },
              { to: "/events/$id/feedback" as const,   label: "Feedback", icon: Sparkles },
            ].map((l) => (
              <Link key={l.to} to={l.to} params={{ id: e.id }}
                    className="flex items-center gap-3 px-4 py-3 border-t transition hover:translate-x-[2px]"
                    style={{ borderColor: border, color: ink }}>
                <l.icon className="w-3.5 h-3.5" style={{ color: muted }}/>
                <span className="text-[13px]">{l.label}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: muted }}/>
              </Link>
            ))}
          </Card>
        </div>
      </div>

      {/* Agenda + Speakers + Venue */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr] mt-8">
        <div className="space-y-6">
          <Card>
            <SectionHead title="Agenda" sub="What we'll do together, in order." />
            <ol className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px" style={{ background: border }}/>
              {e.agenda.map((a, i) => (
                <li key={i} className="relative mb-5 last:mb-0">
                  <span className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full" style={{ background: soft, border: `2px solid ${primary}` }}/>
                  <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>{a.time}</div>
                  <div className="font-serif text-[16px] mt-0.5" style={{ color: ink }}>{a.title}</div>
                  {a.detail && <div className="text-[12.5px] mt-1" style={{ color: muted }}>{a.detail}</div>}
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <SectionHead title="Speakers" />
            <div className="grid gap-3 sm:grid-cols-2">
              {e.speakers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3"
                     style={{ background: surface2, border: `1px solid ${border}` }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-[14px]"
                       style={{ background: soft, color: primary }}>{s.initials}</div>
                  <div className="min-w-0">
                    <div className="font-serif text-[15px] truncate" style={{ color: ink }}>{s.name}</div>
                    <div className="text-[11.5px] truncate" style={{ color: muted }}>{s.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHead title="What to bring" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {e.requirements.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px]" style={{ color: ink }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: primary }}/> {r}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHead title="FAQ" />
            <div className="space-y-2">
              {faqs.map((f, i) => (
                <details key={i} className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <summary className="cursor-pointer text-[13.5px] flex items-center gap-2" style={{ color: ink }}>
                    <HelpCircle className="w-3.5 h-3.5" style={{ color: muted }}/> {f.q}
                  </summary>
                  <p className="text-[12.5px] mt-2" style={{ color: muted }}>{f.a}</p>
                </details>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <button className="text-[12px] rounded-full h-10 px-4 inline-flex items-center gap-1.5"
              style={{ background: surface2, border: `1px solid ${border}`, color: muted }}>
              <Flag className="w-3.5 h-3.5"/> Report event
            </button>
            <a href={`mailto:${org.contact}?subject=Question about ${e.title}`}
               className="text-[12px] rounded-full h-10 px-4 inline-flex items-center gap-1.5"
               style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
              <MessageCircle className="w-3.5 h-3.5"/> Ask organizer
            </a>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <SectionHead title="Venue" />
            <div className="rounded-2xl overflow-hidden mb-3" style={{ background: soft, border: `1px solid ${border}`, height: 160 }}>
              <svg viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
                <rect width="300" height="160" fill="url(#mapGrad)"/>
                <defs>
                  <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={soft}/>
                    <stop offset="100%" stopColor={surface2}/>
                  </linearGradient>
                </defs>
                <path d="M0,110 Q90,85 150,110 T300,105" stroke="#c9d3bf" strokeWidth="6" fill="none" strokeLinecap="round"/>
                <path d="M0,60 Q100,40 200,65 T300,55" stroke="#c6d9ee" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <circle cx="160" cy="80" r="8" fill={primary} />
                <circle cx="160" cy="80" r="16" fill="none" stroke={primary} strokeOpacity="0.4" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[13px] flex items-start gap-2" style={{ color: ink }}>
              {e.mode === "online" ? <Video className="w-4 h-4 mt-0.5" style={{ color: muted }}/> : <MapPin className="w-4 h-4 mt-0.5" style={{ color: muted }}/>}
              <div>
                <div>{e.location}</div>
                <div className="text-[11.5px]" style={{ color: muted }}>{e.city} · {e.college}</div>
              </div>
            </div>
            <a href="#" onClick={(ev) => ev.preventDefault()}
               className="mt-3 text-[12px] inline-flex items-center gap-1" style={{ color: primary }}>
              Get directions <ExternalLink className="w-3 h-3"/>
            </a>
          </Card>

          <Card>
            <SectionHead title="Who's going" />
            <div className="flex -space-x-2 mb-3">
              {["AA","KA","RJ","MV","NP","SI"].map((i, k) => (
                <div key={k} className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-[11px]"
                     style={{ background: [soft, surface2][k % 2], color: primary, border: `2px solid ${surface}` }}>
                  {i}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px]"
                   style={{ background: surface2, color: muted, border: `2px solid ${surface}` }}>+{Math.max(0, e.registered - 6)}</div>
            </div>
            <div className="text-[12px] flex items-center gap-1.5" style={{ color: muted }}>
              <Users className="w-3.5 h-3.5"/> {e.registered} student{e.registered === 1 ? "" : "s"} joining
            </div>
            <Link to="/events/$id/chat" params={{ id: e.id }}
              className="mt-4 rounded-full h-10 px-3 inline-flex items-center gap-1.5 text-[12px]"
              style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
              <MessageCircle className="w-3.5 h-3.5"/> Open community chat
            </Link>
          </Card>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-10">
          <SectionHead title="You might also like" action={<Link to="/events/browse" className="text-[12px]" style={{ color: primary }}>Browse more →</Link>}/>
          <div className="grid gap-4 sm:grid-cols-3">
            {similar.map((s) => <EventCard key={s.id} e={s} layout="grid" />)}
          </div>
        </section>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 lg:bottom-10 z-50 rounded-full px-4 h-11 flex items-center text-[13px]"
             style={{ background: ink, color: "var(--pc-bg)", boxShadow: "0 20px 40px -20px rgba(0,0,0,0.35)" }}>
          {toast}
        </div>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/")({ component: EventDetail });
