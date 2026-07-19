import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { CalendarDays, Bookmark, Clock, Check, Ban, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, PageTitle, EventCard, Chip, EmptyState, GhostBtn } from "@/components/events/primitives";
import { events, loadRsvps, bookmarks, statusOf, eventById, attendanceFor } from "@/lib/events-store";

const { muted, primary } = palette;

type Tab = "upcoming" | "today" | "completed" | "cancelled" | "bookmarked" | "waitlisted" | "past";

function MyEvents() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("peacecode-events-changed", on);
    return () => window.removeEventListener("peacecode-events-changed", on);
  }, []);

  const data = useMemo(() => {
    const rsvps = loadRsvps();
    const bmk = bookmarks();
    const list = events;
    const ids = Object.keys(rsvps);
    const rsvpEvents = ids.map((id) => ({ e: eventById(id)!, rsvp: rsvps[id] })).filter((x) => x.e);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    return {
      upcoming: rsvpEvents.filter((x) => statusOf(x.e) === "upcoming" && x.rsvp.status === "attend").map((x) => x.e),
      today:    rsvpEvents.filter((x) => {
        const t = new Date(x.e.date).getTime();
        return t >= today.getTime() && t < tomorrow.getTime();
      }).map((x) => x.e),
      completed: rsvpEvents.filter((x) => attendanceFor(x.e.id)?.status === "completed").map((x) => x.e),
      cancelled: rsvpEvents.filter((x) => x.rsvp.status === "not_interested").map((x) => x.e),
      bookmarked: bmk.map(eventById).filter(Boolean) as typeof list,
      waitlisted: rsvpEvents.filter((x) => x.rsvp.status === "waitlist").map((x) => x.e),
      past: list.filter((e) => statusOf(e) === "completed"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const tabs: { k: Tab; label: string; count: number; icon?: React.ElementType }[] = [
    { k: "upcoming",   label: "Upcoming",    count: data.upcoming.length,   icon: CalendarDays },
    { k: "today",      label: "Today",       count: data.today.length,      icon: Clock },
    { k: "completed",  label: "Completed",   count: data.completed.length,  icon: Check },
    { k: "waitlisted", label: "Waitlisted",  count: data.waitlisted.length, icon: Sparkles },
    { k: "bookmarked", label: "Bookmarked",  count: data.bookmarked.length, icon: Bookmark },
    { k: "cancelled",  label: "Not going",   count: data.cancelled.length,  icon: Ban },
    { k: "past",       label: "Past events", count: data.past.length,       icon: Clock },
  ];

  const list = data[tab];

  return (
    <Page wide>
      <PageTitle
        eyebrow="My events"
        title="What you said yes to."
        sub="RSVPs, bookmarks, and events that already passed — kept side by side."
        right={<Link to="/events/browse"><GhostBtn>Discover more →</GhostBtn></Link>}
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-2 px-2 pc-no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t.k} active={tab === t.k} onClick={() => setTab(t.k)}>
            {t.icon && <t.icon className="w-3 h-3"/>} {t.label}
            <span className="ml-1 tabular-nums" style={{ color: tab === t.k ? "#fff" : muted }}>{t.count}</span>
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={
            tab === "upcoming"  ? "Nothing on your calendar yet." :
            tab === "today"     ? "Nothing on today." :
            tab === "completed" ? "You'll see completed events here." :
            tab === "bookmarked"? "No bookmarks yet." :
            tab === "waitlisted"? "You're not on any waitlist." :
            tab === "cancelled" ? "Nothing marked as not going." :
                                  "No past events yet."
          }
          sub="Browse events to find one that fits."
          cta={<Link to="/events/browse"><GhostBtn>Browse events →</GhostBtn></Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <EventCard key={e.id} e={e} layout="grid" />)}
        </div>
      )}

      <div className="mt-8 text-[12px]" style={{ color: muted }}>
        <Link to="/events" style={{ color: primary }}>← Back to events home</Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/my")({ component: MyEvents });
