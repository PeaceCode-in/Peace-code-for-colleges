import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Sparkles, CalendarDays, MapPin, Trophy, Bookmark, Grid3x3, Users,
} from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  Page, PageTitle, Card, Chip, EventCard, SectionHead, EmptyState, PrimaryBtn, GhostBtn, StatPill,
} from "@/components/events/primitives";
import {
  events, CATEGORIES, statusOf, recommendationsFor, bookmarks as loadBookmarks,
  eventById, loadRsvps, formatDateParts,
} from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;

function Home() {
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("peacecode-events-changed", on);
    return () => window.removeEventListener("peacecode-events-changed", on);
  }, []);

  const now = Date.now();
  const upcoming = useMemo(() => events
    .filter((e) => new Date(e.date).getTime() >= now - 24 * 3600_000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [now]);

  const today = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 1);
    return upcoming.filter((e) => {
      const t = new Date(e.date).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
  }, [upcoming]);

  const featured = upcoming.find((e) => e.featured) ?? upcoming[0];
  const rec = useMemo(() => recommendationsFor({ mood: "tense" }).slice(0, 6), []);
  const bookmarked = loadBookmarks().map(eventById).filter(Boolean) as typeof events;
  const rsvpIds = Object.keys(loadRsvps());
  const recentlyJoined = rsvpIds.map(eventById).filter(Boolean).slice(0, 4) as typeof events;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = tick;

  const filteredForSearch = q.trim()
    ? events.filter((e) => (e.title + e.category + e.tagline + e.location).toLowerCase().includes(q.toLowerCase()))
    : [];

  const highlightCity = "Bengaluru";
  const near = events.filter((e) => e.city === highlightCity).slice(0, 3);

  return (
    <Page wide>
      <PageTitle
        eyebrow="Community events"
        title="Small, well-lit things happening near you."
        sub="Wellness circles, study groups, workshops, and quiet meetups — chosen for how gentle they feel, not how loud."
        right={
          <div className="flex items-center gap-2">
            <Link to="/events/browse"><GhostBtn><Grid3x3 className="w-3.5 h-3.5"/>Browse all</GhostBtn></Link>
            <Link to="/events/my"><PrimaryBtn><CalendarDays className="w-3.5 h-3.5"/>My events</PrimaryBtn></Link>
          </div>
        }
      />

      {/* Search */}
      <Card className="mb-8" tone="surface2">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 shrink-0" style={{ color: muted }}/>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, organizers, colleges, speakers…"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: ink }}
          />
          {q && <button onClick={() => setQ("")} className="text-[11px]" style={{ color: muted }}>Clear</button>}
          <Link to="/events/browse" className="text-[11.5px] rounded-full h-9 px-3 hidden sm:inline-flex items-center"
                style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
            Advanced search →
          </Link>
        </div>
        {filteredForSearch.length > 0 && (
          <div className="mt-4 border-t pt-4 grid gap-2" style={{ borderColor: border }}>
            {filteredForSearch.slice(0, 5).map((e) => (
              <EventCard key={e.id} e={e} layout="row" />
            ))}
          </div>
        )}
      </Card>

      {/* stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatPill icon={<CalendarDays className="w-3.5 h-3.5"/>} label="Upcoming" value={upcoming.length} />
        <StatPill icon={<Users className="w-3.5 h-3.5"/>}         label="You RSVP'd" value={rsvpIds.length} />
        <StatPill icon={<Bookmark className="w-3.5 h-3.5"/>}      label="Bookmarked" value={bookmarked.length} />
        <StatPill icon={<Trophy className="w-3.5 h-3.5"/>}        label="Categories" value={CATEGORIES.length} />
      </div>

      {/* Today */}
      <section className="mb-10">
        <SectionHead
          title="Today's events"
          sub={today.length ? "Happening in the next 24 hours." : "Nothing on today. A quiet day is a good day."}
          action={<Link to="/events/browse" className="text-[12px]" style={{ color: primary }}>Explore this week →</Link>}
        />
        {today.length ? (
          <div className="grid gap-3">
            {today.map((e) => <EventCard key={e.id} e={e} layout="row" />)}
          </div>
        ) : (
          <EmptyState
            title="No events today"
            sub="You could catch up on the Resource library, or peek at what's on this week."
            cta={
              <div className="flex gap-2">
                <Link to="/resources"><GhostBtn>Resources</GhostBtn></Link>
                <Link to="/events/browse"><PrimaryBtn>This week →</PrimaryBtn></Link>
              </div>
            }
          />
        )}
      </section>

      {/* Featured */}
      {featured && (
        <section className="mb-10">
          <SectionHead title="Featured event" sub="One thing worth blocking your calendar for." />
          <EventCard e={featured} layout="featured" />
        </section>
      )}

      {/* Upcoming rail */}
      <section className="mb-10">
        <SectionHead
          title="Coming up"
          sub="The next few days across your campus and online."
          action={<Link to="/events/calendar" className="text-[12px]" style={{ color: primary }}>Open calendar →</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.slice(0, 6).map((e) => <EventCard key={e.id} e={e} layout="grid" />)}
        </div>
      </section>

      {/* Recommended */}
      <section className="mb-10">
        <SectionHead
          title="Recommended for you"
          sub="Based on your mood, journal, and recent Mind Gym reps."
          action={<Chip tone="warm"><Sparkles className="w-3 h-3"/> AI suggested</Chip>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rec.map((e) => <EventCard key={e.id} e={e} layout="grid" />)}
        </div>
      </section>

      {/* Near you */}
      <section className="mb-10">
        <SectionHead
          title={`Near you — ${highlightCity}`}
          sub="A placeholder for location. In app, this reads from your saved city."
          action={<Chip tone="outline"><MapPin className="w-3 h-3"/> {highlightCity}</Chip>}
        />
        {near.length ? (
          <div className="grid gap-3">
            {near.map((e) => <EventCard key={e.id} e={e} layout="row" />)}
          </div>
        ) : <EmptyState title="Nothing near you yet" sub="Try browsing by category." />}
      </section>

      {/* Recently joined */}
      {recentlyJoined.length > 0 && (
        <section className="mb-10">
          <SectionHead
            title="Recently joined"
            action={<Link to="/events/my" className="text-[12px]" style={{ color: primary }}>My events →</Link>}
          />
          <div className="grid gap-3">
            {recentlyJoined.map((e) => <EventCard key={e.id} e={e} layout="row" />)}
          </div>
        </section>
      )}

      {/* Campus highlights */}
      <section className="mb-10">
        <SectionHead title="Campus highlights" sub="Quiet moments from recent gatherings." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["#e5d3b3", "#c6d9ee", "#bcd0b3"].map((c, i) => {
            const { day, month } = formatDateParts(events[i].date);
            return (
              <Card key={i} padded={false} className="overflow-hidden">
                <div className="h-40 relative" style={{ background: c }}>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                    <circle cx="80" cy="60" r="45" fill="rgba(255,255,255,0.4)" />
                    <circle cx="230" cy="120" r="60" fill="rgba(255,255,255,0.25)" />
                  </svg>
                </div>
                <div className="p-4">
                  <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>{month} {day} · Campus recap</div>
                  <div className="font-serif text-[16.5px] mt-1" style={{ color: ink }}>{events[i].title}</div>
                  <div className="text-[12px] mt-1 line-clamp-2" style={{ color: muted }}>{events[i].tagline}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Categories */}
      <section className="mb-4">
        <SectionHead title="Quick categories" action={<Link to="/events/categories" className="text-[12px]" style={{ color: primary }}>All categories →</Link>}/>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.slice(0, 14).map((c) => (
            <Link key={c.key} to="/events/browse" search={{ category: c.key }}
              className="rounded-full h-10 px-4 inline-flex items-center gap-2 text-[12.5px] transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.hue }}/>
              {c.key}
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom row of secondary links */}
      <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/events/my"           className="rounded-[22px] p-5 flex items-start gap-3 transition hover:-translate-y-[1px]" style={{ background: surface, border: `1px solid ${border}` }}>
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: soft, color: primary }}><CalendarDays className="w-4 h-4"/></span>
          <div><div className="font-serif text-[15.5px]">My events</div><div className="text-[11.5px]" style={{ color: muted }}>Upcoming, past, bookmarked.</div></div>
        </Link>
        <Link to="/events/calendar"      className="rounded-[22px] p-5 flex items-start gap-3 transition hover:-translate-y-[1px]" style={{ background: surface, border: `1px solid ${border}` }}>
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: soft, color: primary }}><CalendarDays className="w-4 h-4"/></span>
          <div><div className="font-serif text-[15.5px]">Calendar</div><div className="text-[11.5px]" style={{ color: muted }}>Day, week, month.</div></div>
        </Link>
        <Link to="/events/bookmarks"     className="rounded-[22px] p-5 flex items-start gap-3 transition hover:-translate-y-[1px]" style={{ background: surface, border: `1px solid ${border}` }}>
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: soft, color: primary }}><Bookmark className="w-4 h-4"/></span>
          <div><div className="font-serif text-[15.5px]">Bookmarks</div><div className="text-[11.5px]" style={{ color: muted }}>Saved for later.</div></div>
        </Link>
        <Link to="/events/achievements"  className="rounded-[22px] p-5 flex items-start gap-3 transition hover:-translate-y-[1px]" style={{ background: surface, border: `1px solid ${border}` }}>
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: soft, color: primary }}><Trophy className="w-4 h-4"/></span>
          <div><div className="font-serif text-[15.5px]">Achievements</div><div className="text-[11.5px]" style={{ color: muted }}>Milestones you've hit.</div></div>
        </Link>
      </section>
    </Page>
  );
}

export const Route = createFileRoute("/events/")({ component: Home });
