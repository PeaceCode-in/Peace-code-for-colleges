import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bookmark, Clock } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, PageTitle, Chip, EventCard, EmptyState, GhostBtn } from "@/components/events/primitives";
import { bookmarks, eventById, statusOf } from "@/lib/events-store";

const { muted, primary } = palette;

type Tab = "all" | "upcoming" | "watchLater";

function Bookmarks() {
  const [tab, setTab] = useState<Tab>("all");
  const [_, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("peacecode-events-changed", on);
    return () => window.removeEventListener("peacecode-events-changed", on);
  }, []);

  const all = bookmarks().map(eventById).filter(Boolean) as ReturnType<typeof eventById>[];
  const list =
    tab === "all"        ? all :
    tab === "upcoming"   ? all.filter((e) => e && statusOf(e) === "upcoming") :
                            all.filter((e) => e && statusOf(e) !== "upcoming");

  return (
    <Page wide>
      <PageTitle
        eyebrow="Bookmarks"
        title="Saved for later."
        sub="Events you tapped the bookmark on. Kept quietly here."
        right={<Link to="/events/browse"><GhostBtn>Find more →</GhostBtn></Link>}
      />

      <div className="flex gap-2 mb-6">
        <Chip active={tab === "all"} onClick={() => setTab("all")}><Bookmark className="w-3 h-3"/> All</Chip>
        <Chip active={tab === "upcoming"} onClick={() => setTab("upcoming")}>Upcoming</Chip>
        <Chip active={tab === "watchLater"} onClick={() => setTab("watchLater")}><Clock className="w-3 h-3"/> Watch later</Chip>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nothing bookmarked yet"
          sub="Tap the bookmark icon on any event to keep it here."
          cta={<Link to="/events/browse"><GhostBtn>Browse events →</GhostBtn></Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => e ? <EventCard key={e.id} e={e} layout="grid" /> : null)}
        </div>
      )}

      <div className="mt-8 text-[12px]" style={{ color: muted }}>
        <Link to="/events" style={{ color: primary }}>← Back to events home</Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/bookmarks")({ component: Bookmarks });
