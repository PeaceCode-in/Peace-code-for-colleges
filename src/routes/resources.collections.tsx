import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { COLLECTIONS, heroBg } from "@/lib/resources-store";

export const Route = createFileRoute("/resources/collections")({
  head: () => ({ meta: [{ title: "Collections — Resources" }] }),
  component: () => (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Curated</div>
          <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>Handpicked collections.</h1>
          <p className="text-[14px] mt-2 max-w-[560px]" style={{ color: "var(--pc-muted)" }}>Small, thoughtful shelves — put together by clinicians and students, for a specific season of student life.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COLLECTIONS.map(c => (
            <Link key={c.slug} to="/resources/collection/$slug" params={{ slug: c.slug }}
              className="group block rounded-3xl overflow-hidden relative min-h-[220px]"
              style={{ background: heroBg(c.hero) }}>
              <div className="absolute inset-0 p-6 flex flex-col justify-end"
                style={{ background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.55) 100%)" }}>
                <div className="text-4xl mb-2">{c.emoji}</div>
                <div className="font-serif text-white text-[22px] leading-tight">{c.title}</div>
                <div className="text-white/85 text-[12px] mt-1 line-clamp-2">{c.description}</div>
                <div className="text-white/70 text-[10px] tracking-[0.2em] uppercase mt-3">{c.resourceIds.length} pieces · {c.curator}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  ),
});
