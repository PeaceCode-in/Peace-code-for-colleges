import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, Mail, Star, CalendarDays, Building2, UserPlus, Check, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, Card, EventCard, EmptyState, PrimaryBtn, GhostBtn, StatPill, SectionHead } from "@/components/events/primitives";
import { organizerById, organizers, events, statusOf, isFollowingOrg, toggleFollowOrg } from "@/lib/events-store";

const { border, muted, ink, soft, primary, surface2 } = palette;

function OrgProfile() {
  const { oid } = Route.useParams();
  const org = organizerById(oid);
  const [following, setFollowing] = useState(false);
  useEffect(() => { setFollowing(isFollowingOrg(oid)); }, [oid]);

  if (!org) {
    return <Page><BackBar/><EmptyState title="Organizer not found" cta={<Link to="/events"><PrimaryBtn>Back to events</PrimaryBtn></Link>}/></Page>;
  }

  const hosted = events.filter((e) => e.organizerId === oid);
  const upcoming = hosted.filter((e) => statusOf(e) === "upcoming");
  const past = hosted.filter((e) => statusOf(e) === "completed");

  return (
    <Page wide>
      <BackBar to="/events" label="All events" />

      {/* Hero */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-[26px] shrink-0"
               style={{ background: soft, color: primary, border: `1px solid ${border}` }}>
            {org.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>{org.role}</div>
            <h1 className="font-serif text-[26px] sm:text-[32px] tracking-tight leading-tight mt-1" style={{ color: ink }}>{org.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px]" style={{ color: muted }}>
              <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> {org.org}</span>
              <span>·</span>
              <span>{org.college}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5"/> {org.rating}</span>
            </div>
            <p className="text-[13px] mt-3 max-w-xl" style={{ color: ink }}>{org.bio}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <button onClick={() => { toggleFollowOrg(oid); setFollowing(isFollowingOrg(oid)); }}
              className="w-full sm:w-auto rounded-full h-11 px-5 text-[12.5px] inline-flex items-center justify-center gap-2 transition"
              style={{ background: following ? soft : ink, color: following ? primary : "#fff", border: `1px solid ${following ? primary : ink}` }}>
              {following ? <><Check className="w-3.5 h-3.5"/> Following</> : <><UserPlus className="w-3.5 h-3.5"/> Follow</>}
            </button>
            <a href={`mailto:${org.contact}`} className="w-full sm:w-auto rounded-full h-11 px-5 text-[12.5px] inline-flex items-center justify-center gap-2"
               style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
              <Mail className="w-3.5 h-3.5"/> Contact
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatPill icon={<CalendarDays className="w-3.5 h-3.5"/>} label="Events hosted" value={org.eventsHosted}/>
        <StatPill icon={<Users className="w-3.5 h-3.5"/>}       label="Followers"     value={org.followers}/>
        <StatPill icon={<Star className="w-3.5 h-3.5"/>}        label="Avg rating"    value={org.rating}/>
        <StatPill icon={<Sparkles className="w-3.5 h-3.5"/>}    label="Upcoming"      value={upcoming.length}/>
      </div>

      <section className="mb-8">
        <SectionHead title="Upcoming events" />
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing scheduled right now" sub="Follow to be the first to know."/>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => <EventCard key={e.id} e={e} layout="grid" />)}
          </div>
        )}
      </section>

      <section className="mb-8">
        <SectionHead title="Past events" />
        {past.length === 0 ? (
          <EmptyState title="No past events yet"/>
        ) : (
          <div className="grid gap-3">
            {past.map((e) => <EventCard key={e.id} e={e} layout="row" />)}
          </div>
        )}
      </section>

      <section>
        <SectionHead title="Other organizers you might like" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organizers.filter((o) => o.id !== oid).slice(0, 3).map((o) => (
            <Link key={o.id} to="/events/organizer/$oid" params={{ oid: o.id }}
              className="rounded-[22px] p-4 flex items-center gap-3 transition hover:-translate-y-[1px]"
              style={{ background: "var(--pc-surface)", border: `1px solid ${border}` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-serif text-[15px]"
                   style={{ background: soft, color: primary }}>{o.initials}</div>
              <div className="min-w-0">
                <div className="font-serif text-[15px] truncate" style={{ color: ink }}>{o.name}</div>
                <div className="text-[11.5px] truncate" style={{ color: muted }}>{o.role} · ⭐ {o.rating}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 flex justify-center">
        <Link to="/events/browse"><GhostBtn>Discover more events →</GhostBtn></Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/organizer/$oid")({
  head: ({ params }) => {
    const o = organizerById(params.oid);
    return {
      meta: [
        { title: o ? `${o.name} — PeaceCode Events` : "Organizer — PeaceCode Events" },
        { name: "description", content: o?.bio ?? "Organizer on PeaceCode Community Events." },
      ],
    };
  },
  component: OrgProfile,
});
