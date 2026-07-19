import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { collectionBySlug, byId, heroBg, COLLECTIONS } from "@/lib/resources-store";

export const Route = createFileRoute("/resources/collection/$slug")({
  loader: ({ params }) => {
    const col = collectionBySlug(params.slug);
    if (!col) throw notFound();
    return { col };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.col.title ?? "Collection"} — Resources` }] }),
  notFoundComponent: () => <AppShell><main className="p-10 text-center"><div className="font-serif text-2xl">Collection not found</div></main></AppShell>,
  errorComponent: ({ error }) => <AppShell><main className="p-10">{error.message}</main></AppShell>,
  component: CollectionPage,
});

function CollectionPage() {
  const { col } = Route.useLoaderData();
  const items = col.resourceIds.map((id: string) => byId(id)).filter(Boolean) as any[];
  const others = COLLECTIONS.filter(c => c.slug !== col.slug).slice(0, 4);
  return (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="rounded-3xl overflow-hidden mb-8 min-h-[280px] relative" style={{ background: heroBg(col.hero) }}>
          <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.55) 100%)" }}>
            <div className="text-5xl mb-3">{col.emoji}</div>
            <h1 className="font-serif text-white text-[36px] sm:text-[48px] leading-[1.05] max-w-[640px]">{col.title}</h1>
            <p className="text-white/90 text-[14px] mt-3 max-w-[560px]">{col.description}</p>
            <div className="mt-4 text-white/80 text-[11px] tracking-[0.2em] uppercase">{items.length} pieces · Curated by {col.curator}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(r => <ResourceCard key={r.id} r={r}/>)}
        </div>
        <section className="mt-14">
          <h2 className="font-serif text-[22px] mb-4" style={{ color: "var(--pc-ink)" }}>Other collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {others.map(c => (
              <Link key={c.slug} to="/resources/collection/$slug" params={{ slug: c.slug }}
                className="rounded-2xl p-4" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
                <div className="text-2xl">{c.emoji}</div>
                <div className="font-serif text-[15px] mt-2" style={{ color: "var(--pc-ink)" }}>{c.title}</div>
                <div className="text-[11px] mt-1" style={{ color: "var(--pc-muted)" }}>{c.resourceIds.length} pieces</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
