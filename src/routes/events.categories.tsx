import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Page, PageTitle, Card, GhostBtn, EventCard } from "@/components/events/primitives";
import { CATEGORIES, events } from "@/lib/events-store";

const { border, muted, ink, primary } = palette;

function Categories() {
  const grouped = CATEGORIES.reduce<Record<string, typeof CATEGORIES>>((acc, c) => {
    (acc[c.group] = acc[c.group] ?? []).push(c);
    return acc;
  }, {});

  const totals: Record<string, number> = {};
  CATEGORIES.forEach((c) => { totals[c.key] = events.filter((e) => e.category === c.key).length; });

  const trending = [...events].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0)).slice(0, 3);

  return (
    <Page wide>
      <PageTitle
        eyebrow="Categories"
        title="Everything, sorted softly."
        sub="Pick a corner of campus life — wellness, career, community, or creative."
        right={<Link to="/events"><GhostBtn>Back to events</GhostBtn></Link>}
      />

      {Object.entries(grouped).map(([group, list]) => (
        <section key={group} className="mb-8">
          <div className="text-[10.5px] tracking-[0.28em] uppercase mb-3" style={{ color: muted }}>{group}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <Link key={c.key} to="/events/browse" search={{ category: c.key }}
                className="rounded-[22px] p-5 flex items-center gap-4 transition hover:-translate-y-[1px]"
                style={{ background: "var(--pc-surface)", border: `1px solid ${border}` }}>
                <div className="w-14 h-14 rounded-2xl relative overflow-hidden shrink-0" style={{ background: c.hue }}>
                  <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
                    <circle cx="15" cy="15" r="14" fill="rgba(255,255,255,0.55)"/>
                    <circle cx="46" cy="44" r="18" fill="rgba(255,255,255,0.35)"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-[16.5px]" style={{ color: ink }}>{c.key}</div>
                  <div className="text-[11.5px]" style={{ color: muted }}>
                    {totals[c.key] || 0} {totals[c.key] === 1 ? "event" : "events"}
                  </div>
                </div>
                <span className="text-[12px]" style={{ color: primary }}>Open →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <Card className="mt-4">
        <div className="text-[10.5px] tracking-[0.28em] uppercase mb-3" style={{ color: muted }}>Trending picks</div>
        <div className="grid gap-4 sm:grid-cols-3">
          {trending.map((e) => <EventCard key={e.id} e={e} layout="grid" />)}
        </div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/events/categories")({ component: Categories });
