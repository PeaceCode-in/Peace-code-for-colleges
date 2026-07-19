import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { authorById, resourcesByAuthor, categoryBySlug, AUTHORS } from "@/lib/resources-store";
import { BadgeCheck, Star } from "lucide-react";

export const Route = createFileRoute("/resources/author/$id")({
  loader: ({ params }) => {
    const a = authorById(params.id);
    if (!a) throw notFound();
    return { a };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.a.name ?? "Author"} — PeaceCode` }] }),
  notFoundComponent: () => <AppShell><main className="p-10 text-center"><div className="font-serif text-2xl">Author not found</div></main></AppShell>,
  errorComponent: ({ error }) => <AppShell><main className="p-10">{error.message}</main></AppShell>,
  component: AuthorPage,
});

function AuthorPage() {
  const { a } = Route.useLoaderData();
  const list = resourcesByAuthor(a.id);
  return (
    <AppShell>
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="rounded-3xl p-8 sm:p-12 mb-10" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-[28px] shrink-0"
              style={{ background: "var(--pc-soft)", color: "var(--pc-primary)" }}>{a.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-[28px] sm:text-[34px] leading-tight" style={{ color: "var(--pc-ink)" }}>{a.name}</h1>
                {a.verified && <BadgeCheck className="w-5 h-5" style={{ color: "var(--pc-primary)" }}/>}
              </div>
              <div className="text-[13px] mt-1" style={{ color: "var(--pc-muted)" }}>{a.title}</div>
              <div className="mt-3 flex items-center gap-3 text-[12px]" style={{ color: "var(--pc-muted)" }}>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" style={{ color: "var(--pc-primary)" }}/> {a.rating.toFixed(1)}</span>
                <span>·</span><span>{list.length} pieces</span>
              </div>
              <p className="text-[14px] leading-[1.7] mt-4 max-w-[640px]" style={{ color: "var(--pc-ink)" }}>{a.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {a.topics.map((t: string) => {
                  const c = categoryBySlug(t);
                  if (!c) return null;
                  return (
                    <Link key={t} to="/resources/c/$slug" params={{ slug: t }}
                      className="text-[11px] px-3 py-1.5 rounded-full"
                      style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)" }}>{c.emoji} {c.name}</Link>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>
                {a.socials.linkedin && <a href={a.socials.linkedin} className="underline">LinkedIn</a>}
                {a.socials.twitter && <a href={a.socials.twitter} className="underline">Twitter</a>}
                {a.socials.site && <a href={a.socials.site} className="underline">Website</a>}
                <Link to="/counselling/experts" className="ml-auto text-[11px] px-3 py-1.5 rounded-full"
                  style={{ background: "var(--pc-primary)", color: "#fff" }}>Book a session</Link>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-serif text-[22px] mb-4" style={{ color: "var(--pc-ink)" }}>Published by {a.name.split(" ")[0]}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(r => <ResourceCard key={r.id} r={r}/>)}
        </div>

        <section className="mt-14">
          <h2 className="font-serif text-[20px] mb-4" style={{ color: "var(--pc-ink)" }}>Other voices</h2>
          <div className="flex flex-wrap gap-2">
            {AUTHORS.filter(x => x.id !== a.id).map(x => (
              <Link key={x.id} to="/resources/author/$id" params={{ id: x.id }} className="px-3 py-1.5 rounded-full text-[12px]"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>{x.name}</Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
