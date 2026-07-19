import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { categoryBySlug, resourcesByCategory, CATEGORIES } from "@/lib/resources-store";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/resources/c/$slug")({
  loader: ({ params }) => {
    const cat = categoryBySlug(params.slug);
    if (!cat) throw notFound();
    return { cat };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.cat.name ?? "Category"} — Resources` }],
  }),
  notFoundComponent: () => (
    <AppShell><main className="p-10 text-center"><div className="font-serif text-2xl">Category not found</div><Link to="/resources/categories" className="underline text-sm">Back to categories</Link></main></AppShell>
  ),
  errorComponent: ({ error }) => <AppShell><main className="p-10">{error.message}</main></AppShell>,
  component: CategoryPage,
});

function CategoryPage() {
  const { cat } = Route.useLoaderData();
  const [sort, setSort] = useState<"newest" | "trending" | "shortest">("newest");
  const items = useMemo(() => {
    const list = resourcesByCategory(cat.slug).slice();
    if (sort === "newest") list.sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
    if (sort === "trending") list.sort((a,b) => b.views - a.views);
    if (sort === "shortest") list.sort((a,b) => a.minutes - b.minutes);
    return list;
  }, [cat.slug, sort]);

  const siblings = CATEGORIES.filter(c => c.slug !== cat.slug).slice(0, 8);

  return (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="rounded-3xl p-8 sm:p-12 mb-8 relative overflow-hidden"
          style={{ background: cat.color + "22", border: "1px solid var(--pc-border)" }}>
          <div className="text-6xl mb-4">{cat.emoji}</div>
          <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Topic</div>
          <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.05]" style={{ color: "var(--pc-ink)" }}>{cat.name}</h1>
          <p className="text-[13px] mt-3" style={{ color: "var(--pc-muted)" }}>{items.length} pieces · updated weekly</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(["newest","trending","shortest"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)} className="text-[12px] px-3 py-1.5 rounded-full transition"
                style={{ background: sort === s ? "var(--pc-soft)" : "var(--pc-surface)", border: "1px solid var(--pc-border)", color: sort === s ? "var(--pc-primary)" : "var(--pc-muted)" }}>
                {s}
              </button>
            ))}
          </div>
          <Link to="/resources/search" search={{ category: cat.slug } as any} className="text-[12px] tracking-[0.18em] uppercase" style={{ color: "var(--pc-muted)" }}>Filter →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(r => <ResourceCard key={r.id} r={r}/>)}
        </div>

        <section className="mt-14">
          <h2 className="font-serif text-[22px] mb-4" style={{ color: "var(--pc-ink)" }}>Explore nearby</h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map(c => (
              <Link key={c.slug} to="/resources/c/$slug" params={{ slug: c.slug }}
                className="px-3 py-1.5 rounded-full text-[12px]"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
