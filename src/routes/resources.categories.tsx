import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, resourcesByCategory } from "@/lib/resources-store";

export const Route = createFileRoute("/resources/categories")({
  head: () => ({ meta: [{ title: "Categories — Resources" }] }),
  component: () => (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Browse</div>
          <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>Every topic, one shelf.</h1>
          <p className="text-[14px] mt-2 max-w-[560px]" style={{ color: "var(--pc-muted)" }}>
            {CATEGORIES.length} categories · gentle to deep. Tap any to open its full collection.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {CATEGORIES.map(c => {
            const count = resourcesByCategory(c.slug).length;
            return (
              <Link key={c.slug} to="/resources/c/$slug" params={{ slug: c.slug }}
                className="group rounded-2xl p-5 relative overflow-hidden transition hover:-translate-y-0.5"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-25 blur-2xl"
                  style={{ background: c.color }}/>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                    style={{ background: c.color + "33" }}>{c.emoji}</div>
                  <div className="font-serif text-[16px]" style={{ color: "var(--pc-ink)" }}>{c.name}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--pc-muted)" }}>{count} pieces</div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  ),
});
